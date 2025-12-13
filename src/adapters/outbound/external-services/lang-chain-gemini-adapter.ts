import {
  BaseChatModel,
  type BaseChatModelCallOptions,
  type BindToolsInput,
} from "@langchain/core/language_models/chat_models";
import {
  BaseMessage,
  AIMessage,
  AIMessageChunk,
} from "@langchain/core/messages";
import { ChatResult, ChatGeneration } from "@langchain/core/outputs";
import type { CallbackManagerForLLMRun } from "@langchain/core/callbacks/manager";
import type { BaseLanguageModelInput } from "@langchain/core/language_models/base";
import type { Runnable } from "@langchain/core/runnables";
import { GeminiAdapter } from "./gemini-adapter.js";
import { Service } from "typedi";

export enum MessageType {
  AI = "ai",
  Human = "human",
  Tool = "tool",
  System = "system",
  User = "User",
  Assistant = "Assistant",
}

@Service()
export class LangChainGeminiAdapter extends BaseChatModel {
  _boundTools?: BindToolsInput[];
  _boundKwargs?: Partial<BaseChatModelCallOptions>;

  constructor(private readonly adapter: GeminiAdapter) {
    super({});
  }

  /**
   * Required by LangChain - returns the type identifier for this model
   */
  _llmType(): string {
    return "gemini-adapter";
  }

  /**
   * Core method that LangChain calls to generate responses
   * Converts LangChain messages to a prompt string, calls the adapter,
   * and converts the response back to LangChain format
   */
  async _generate(
    messages: BaseMessage[],
    _options?: Record<string, unknown>,
    _runManager?: CallbackManagerForLLMRun,
  ): Promise<ChatResult> {
    try {
      // Convert LangChain messages to a single prompt string
      const prompt = this._convertMessagesToPrompt(messages);

      // Call the existing GeminiAdapter
      const response = await this.adapter.generateResponse(prompt);

      // Convert the response to LangChain's ChatResult format
      const generation: ChatGeneration = {
        text: response,
        message: new AIMessage(response),
      };

      return {
        generations: [generation],
        llmOutput: {},
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`LangChain Gemini generation failed: ${error.message}`);
      }
      throw new Error("Unknown LangChain Gemini generation error");
    }
  }

  /**
   * Converts an array of LangChain messages into a single prompt string
   * This handles the conversation history properly
   */
  private _convertMessagesToPrompt(messages: BaseMessage[]): string {
    return messages
      .map((message) => {
        const role = message.type;
        const content = message.content;

        switch (role) {
          case MessageType.Human:
          case MessageType.User: {
            return `User: ${content}`;
          }
          case MessageType.AI:
          case MessageType.Assistant: {
            return `Assistant: ${content}`;
          }
          case MessageType.System: {
            return `System: ${content}`;
          }
          // No default
        }
        return String(content);
      })
      .join("\n\n");
  }

  bindTools(
    tools: BindToolsInput[],
    kwargs?: Partial<BaseChatModelCallOptions>,
  ): Runnable<
    BaseLanguageModelInput,
    AIMessageChunk,
    BaseChatModelCallOptions
  > {
    const boundModel = new LangChainGeminiAdapter(this.adapter);

    boundModel._boundTools = tools;
    boundModel._boundKwargs = kwargs;

    return boundModel as unknown as Runnable<
      BaseLanguageModelInput,
      AIMessageChunk,
      BaseChatModelCallOptions
    >;
  }
}
