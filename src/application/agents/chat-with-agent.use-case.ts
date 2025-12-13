import { Service, Inject } from "typedi";
import { AgentRepository } from "../../domain/ports/outbound/agent-repository.js";
import { ChatRepository } from "../../domain/ports/outbound/chat-repository.js";
import { RetrieveContextUseCase } from "../services/retrieve-context.use-case.js";
import { LangChainGeminiAdapter } from "../../adapters/outbound/external-services/lang-chain-gemini-adapter.js";
import {
  HumanMessage,
  SystemMessage,
  BaseMessage,
  AIMessage,
} from "@langchain/core/messages";
import {
  AGENT_REPOSITORY,
  CHAT_REPOSITORY,
} from "../../infrastructure/constants.js";
import { Agent, AgentType } from "../../domain/entities/agent.js";
import { DocumentChunk } from "../../domain/entities/document-chunk.js";
import { ChatRole } from "../../domain/entities/chat-message.js";
import { randomUUID } from "node:crypto";

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
    @Inject(() => RetrieveContextUseCase)
    private readonly retrieveContext: RetrieveContextUseCase,
    @Inject(() => LangChainGeminiAdapter)
    private readonly llm: LangChainGeminiAdapter,
  ) {}

  async execute(input: ChatWithAgentInput): Promise<string> {
    const { agentId, userId, message, threadId } = input;

    // 1. Retrieve and Validate Agent
    const agent = await this.agentRepository.findById(agentId);
    if (!agent) {
      throw new Error("Agente no encontrado");
    }

    if (agent.type === AgentType.PRIVATE && agent.userId !== userId) {
      throw new Error("Unauthorized access to private agent");
    }

    // Thread Verification
    if (threadId) {
      await this.validateThreadAccess(threadId, userId, agent);
    }

    // 2. Retrieve Context (RAG)
    const chunks: DocumentChunk[] = await this.retrieveContext.execute(
      userId,
      message,
    );

    const contextText = chunks
      .map(
        (chunk) =>
          `[Source: ${chunk.metadata?.source || "Unknown"}]\n${chunk.content}`,
      )
      .join("\n\n");

    // 3. Construct Prompt (System + History)
    const messages: BaseMessage[] = [
      this.buildSystemMessage(agent, contextText),
    ];

    // Load History if Threaded
    if (threadId) {
      const history = await this.chatRepository.getMessages(threadId);
      for (const message_ of history) {
        if (message_.role === ChatRole.USER) {
          messages.push(new HumanMessage(message_.content));
        } else if (message_.role === ChatRole.ASSISTANT) {
          messages.push(new AIMessage(message_.content));
        }
      }
    }

    // Add current user message
    messages.push(new HumanMessage(message));

    // 4. Generate Response
    const response = await this.llm.invoke(messages);
    const replyContent = response.content.toString();

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
      throw new Error("Threading is disabled for this agent");
    }
    const thread = await this.chatRepository.getThreadById(threadId);
    if (!thread) throw new Error("Thread not found");
    if (thread.userId !== userId)
      throw new Error("Unauthorized access to thread");
  }

  private buildSystemMessage(agent: Agent, contextText: string): SystemMessage {
    return new SystemMessage(`
You are an AI assistant named "${agent.name}".
Your instructions are:
${agent.configuration.systemPrompt}

Tone: ${agent.configuration.tone}

Use the following context to answer the user's question.
If the answer is not in the context, use your general knowledge but prioritize the instructions.

Context:
${contextText}
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
