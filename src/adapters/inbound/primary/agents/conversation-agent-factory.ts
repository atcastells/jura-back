import { Service } from "typedi";
import {
  HumanMessage,
  BaseMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ToolRegistry } from "../../../outbound/external-services/tools/index.js";
import type { DynamicStructuredTool } from "@langchain/core/tools";

interface ToolCall {
  name: string;
  args: Record<string, unknown>;
  id?: string;
}

/**
 * ConversationAgentFactory
 *
 * Primary adapter that builds a LangChain ReAct agent wired to
 * ChatGoogleGenerativeAI (native Gemini support with function calling) and ToolRegistry tools.
 *
 * - Keeps LangChain specifics isolated in infrastructure layer
 * - Exposes a factory for obtaining an AgentExecutor
 * - Supports chat history via MessagesPlaceholder("chat_history")
 * - Uses native Gemini function calling for tool usage
 */
@Service()
export class ConversationAgentFactory {
  private readonly llm?: ChatGoogleGenerativeAI;
  private readonly systemPrompt: string | undefined;
  private readonly isEnabled: boolean;

  constructor(private readonly toolsRegistry: ToolRegistry) {
    // Check if system prompt is available
    this.systemPrompt = process.env.AGENT_SYSTEM_PROMPT ?? undefined;
    this.isEnabled = !!this.systemPrompt;

    if (this.isEnabled) {
      // Initialize ChatGoogleGenerativeAI with function calling support
      this.llm = new ChatGoogleGenerativeAI({
        apiKey: process.env.GEMINI_API_KEY,
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
        temperature: 0.7,
      });
    }
  }

  /**
   * Check if the conversation agent is enabled.
   * Returns false if AGENT_SYSTEM_PROMPT environment variable is not set.
   */
  isAgentEnabled(): boolean {
    return this.isEnabled;
  }

  private createModel(): ChatGoogleGenerativeAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }

    return new ChatGoogleGenerativeAI({
      apiKey,
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      temperature: 0.7,
    });
  }

  /**
   * Executes a single tool call and returns the resulting ToolMessage.
   */
  private async executeToolCall(
    toolCall: ToolCall,
    tools: DynamicStructuredTool[],
  ): Promise<ToolMessage | undefined> {
    const tool = tools.find(
      (t: DynamicStructuredTool) => t.name === toolCall.name,
    );

    if (!tool) {
      return undefined;
    }

    try {
      const toolResult = await tool.invoke(toolCall.args);
      return new ToolMessage({
        content: String(toolResult),
        tool_call_id: toolCall.id ?? "",
      });
    } catch (error) {
      return new ToolMessage({
        content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        tool_call_id: toolCall.id ?? "",
      });
    }
  }

  /**
   * Executes all tool calls and returns their result messages.
   */
  private async executeToolCalls(
    toolCalls: ToolCall[],
    tools: DynamicStructuredTool[],
  ): Promise<ToolMessage[]> {
    const results: ToolMessage[] = [];

    for (const toolCall of toolCalls) {
      const result = await this.executeToolCall(toolCall, tools);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Create a ReAct agent with our LLM and available tools.
   * The agent supports chat_history passed in at invocation time.
   * Returns undefined if the adapter is not enabled (no system prompt configured).
   */
  build():
    | {
        invoke: (arguments_: {
          input: string;
          chat_history?: BaseMessage[];
        }) => Promise<{ messages: BaseMessage[] }>;
      }
    | undefined {
    if (!this.isEnabled || !this.llm || !this.systemPrompt) {
      return undefined;
    }

    // 1) Obtain tools from the registry
    const tools = this.toolsRegistry.getAllTools();

    // 2) Bind tools to the model for function calling
    const modelWithTools = this.llm.bindTools(tools);

    // 3) Create a simple agent wrapper that handles the tool calling loop
    return {
      invoke: async ({
        input,
        chat_history,
      }: {
        input: string;
        chat_history?: BaseMessage[];
      }) => {
        const messages: BaseMessage[] = [
          new SystemMessage(this.systemPrompt!),
          ...(chat_history ?? []),
          new HumanMessage(input),
        ];

        // Invoke the model with tools
        const response = await modelWithTools.invoke(messages);

        // Check if the model wants to use tools
        if (response.tool_calls && response.tool_calls.length > 0) {
          const allMessages = [...messages, response];

          // Execute all tool calls
          const toolResults = await this.executeToolCalls(
            response.tool_calls,
            tools,
          );
          allMessages.push(...toolResults);

          // Get final response with tool results
          const finalResponse = await this.llm!.invoke(allMessages);
          return { messages: [...allMessages, finalResponse] };
        }

        // No tools needed, return direct response
        return { messages: [...messages, response] };
      },
    };
  }

  buildWithSystemPrompt(options: {
    systemPrompt: string;
    tools: DynamicStructuredTool[];
    maxToolRounds?: number;
  }): {
    invoke: (arguments_: {
      input: string;
      chat_history?: BaseMessage[];
    }) => Promise<{ messages: BaseMessage[] }>;
  } {
    const model = this.createModel();
    const tools = options.tools;
    const maxToolRounds = options.maxToolRounds ?? 3;

    const modelWithTools = model.bindTools(tools);

    return {
      invoke: async ({
        input,
        chat_history,
      }: {
        input: string;
        chat_history?: BaseMessage[];
      }) => {
        const messages: BaseMessage[] = [
          new SystemMessage(options.systemPrompt),
          ...(chat_history ?? []),
          new HumanMessage(input),
        ];

        const allMessages: BaseMessage[] = [...messages];

        // Tool-calling loop (bounded)
        for (let round = 0; round < maxToolRounds; round++) {
          const response = await modelWithTools.invoke(allMessages);
          allMessages.push(response);

          if (!response.tool_calls || response.tool_calls.length === 0) {
            return { messages: allMessages };
          }

          const toolResults = await this.executeToolCalls(
            response.tool_calls,
            tools,
          );

          // If we couldn't resolve any tool call, stop to avoid infinite loops
          if (toolResults.length === 0) {
            return { messages: allMessages };
          }

          allMessages.push(...toolResults);
        }

        // Max rounds reached; get a final response without forcing further tools
        const finalResponse = await model.invoke(allMessages);
        return { messages: [...allMessages, finalResponse] };
      },
    };
  }
}
