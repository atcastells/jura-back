import { Service } from 'typedi';
import { HumanMessage, BaseMessage, SystemMessage } from '@langchain/core/messages';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ToolRegistry } from '../../../outbound/external-services/tools';

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
  private llm?: ChatGoogleGenerativeAI;
  private systemPrompt: string | null;
  private isEnabled: boolean;

  constructor(
    private toolsRegistry: ToolRegistry,
  ) {
    // Check if system prompt is available
    this.systemPrompt = process.env.AGENT_SYSTEM_PROMPT || null;
    this.isEnabled = !!this.systemPrompt;

    if (this.isEnabled) {
      // Initialize ChatGoogleGenerativeAI with function calling support
      this.llm = new ChatGoogleGenerativeAI({
        apiKey: process.env.GEMINI_API_KEY,
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
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

  /**
   * Create a ReAct agent with our LLM and available tools.
   * The agent supports chat_history passed in at invocation time.
   * Returns null if the adapter is not enabled (no system prompt configured).
   */
  build(): any | null {
    if (!this.isEnabled || !this.llm || !this.systemPrompt) {
      return null;
    }

    // 1) Obtain tools from the registry
    const tools = this.toolsRegistry.getAllTools();

    // 2) Bind tools to the model for function calling
    const modelWithTools = this.llm.bindTools(tools);

    // 3) Create a simple agent wrapper that handles the tool calling loop
    return {
      invoke: async ({ input, chat_history }: { input: string; chat_history?: BaseMessage[] }) => {
        const messages: BaseMessage[] = [
          new SystemMessage(this.systemPrompt!),
          ...(chat_history || []),
          new HumanMessage(input),
        ];

        // Invoke the model with tools
        const response = await modelWithTools.invoke(messages);
        
        // Check if the model wants to use tools
        if (response.tool_calls && response.tool_calls.length > 0) {
          const allMessages = [...messages, response];
          
          // Execute each tool call
          for (const toolCall of response.tool_calls) {
            const tool = tools.find(t => t.name === toolCall.name);
            if (tool) {
              try {
                const toolResult = await tool.invoke(toolCall.args);
                allMessages.push({
                  role: 'tool',
                  content: toolResult,
                  tool_call_id: toolCall.id,
                  _getType: () => 'tool',
                } as any);
              } catch (error) {
                allMessages.push({
                  role: 'tool',
                  content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                  tool_call_id: toolCall.id,
                  _getType: () => 'tool',
                } as any);
              }
            }
          }
          
          // Get final response with tool results
          const finalResponse = await this.llm!.invoke(allMessages);
          return { messages: [...allMessages, finalResponse] };
        }

        // No tools needed, return direct response
        return { messages: [...messages, response] };
      },
    };
  }
}
