import { Service, Inject } from "typedi";
import { AgentRepository } from "../../domain/ports/outbound/agent-repository.js";
import { ChatRepository } from "../../domain/ports/outbound/chat-repository.js";
import { ConversationAgentFactory } from "../../adapters/inbound/primary/agents/conversation-agent-factory.js";
import {
  HumanMessage,
  SystemMessage,
  AIMessage,
  BaseMessage,
} from "@langchain/core/messages";
import {
  AGENT_REPOSITORY,
  CHAT_REPOSITORY,
} from "../../infrastructure/constants.js";
import { Agent, AgentType } from "../../domain/entities/agent.js";
import { ChatRole } from "../../domain/entities/chat-message.js";
import { randomUUID } from "node:crypto";
import { HttpError } from "../../adapters/inbound/http/errors/http-error.js";
import { createRetrieveContextTool } from "../../adapters/outbound/external-services/tools/rag/retrieve-context.tool.js";

export interface ChatWithAgentInput {
  agentId: string;
  userId: string;
  message: string;
  threadId?: string;
}

@Service()
export class ChatWithAgentUseCase {
  constructor(
    @Inject(AGENT_REPOSITORY)
    private readonly agentRepository: AgentRepository,
    @Inject(CHAT_REPOSITORY)
    private readonly chatRepository: ChatRepository,
    @Inject(() => ConversationAgentFactory)
    private readonly conversationAgentFactory: ConversationAgentFactory,
  ) {}

  async execute(input: ChatWithAgentInput): Promise<string> {
    const { agentId, userId, message, threadId } = input;

    // 1. Retrieve and Validate Agent
    const agent = await this.agentRepository.findById(agentId);
    if (!agent) {
      throw new HttpError(404, "Agent not found");
    }

    if (agent.type === AgentType.PRIVATE && agent.userId !== userId) {
      throw new HttpError(403, "Unauthorized access to private agent");
    }

    // Thread Verification
    if (threadId) {
      await this.validateThreadAccess(threadId, userId, agent);
    }

    // 2. Construct Prompt (System + History)
    // RAG is available as a tool; it should be invoked by the model when needed.
    const systemMessage = this.buildSystemMessage(agent);
    const chatHistory: BaseMessage[] = [];

    // Load History if Threaded
    if (threadId) {
      const history = await this.chatRepository.getMessages(threadId);
      for (const message_ of history) {
        if (message_.role === ChatRole.USER) {
          chatHistory.push(new HumanMessage(message_.content));
        } else if (message_.role === ChatRole.ASSISTANT) {
          chatHistory.push(new AIMessage(message_.content));
        }
      }
    }

    // 3. Generate Response via tool-capable agent
    const tools = [createRetrieveContextTool(userId)];
    const agentExecutor = this.conversationAgentFactory.buildWithSystemPrompt({
      systemPrompt: systemMessage.content.toString(),
      tools,
    });

    const result = await agentExecutor.invoke({
      input: message,
      chat_history: chatHistory,
    });

    const lastMessage = result.messages[result.messages.length - 1];
    const replyContent = lastMessage?.content?.toString() ?? "";

    // 5. Save Persistence (Async)
    if (threadId) {
      await this.saveHistory(threadId, message, replyContent);
    }

    return replyContent;
  }

  private async validateThreadAccess(
    threadId: string,
    userId: string,
    agent: Agent,
  ) {
    if (!agent.configuration.enableThreads) {
      throw new HttpError(403, "Threading is disabled for this agent");
    }
    const thread = await this.chatRepository.getThreadById(threadId);
    if (!thread) throw new HttpError(404, "Thread not found");
    if (thread.userId !== userId)
      throw new HttpError(403, "Unauthorized access to thread");
  }

  private buildSystemMessage(agent: Agent): SystemMessage {
    return new SystemMessage(`
You are an AI assistant named "${agent.name}".
Your instructions are:
${agent.configuration.systemPrompt}

Tone: ${agent.configuration.tone}

If you need factual details from the user's uploaded documents, call the tool "retrieve_context" with an appropriate query.
The tool returns JSON with relevant snippets and metadata. Use it to ground your answer.
`);
  }

  private async saveHistory(
    threadId: string,
    userMessage: string,
    assistantMessage: string,
  ) {
    await this.chatRepository.saveMessage({
      id: randomUUID(),
      threadId,
      role: ChatRole.USER,
      content: userMessage,
      createdAt: new Date(),
    });

    await this.chatRepository.saveMessage({
      id: randomUUID(),
      threadId,
      role: ChatRole.ASSISTANT,
      content: assistantMessage,
      createdAt: new Date(),
    });
  }
}
