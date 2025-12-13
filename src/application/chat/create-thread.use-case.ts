import { Service, Inject } from "typedi";
import {
  CHAT_REPOSITORY,
  AGENT_REPOSITORY,
} from "../../infrastructure/constants.js";
import { ChatRepository } from "../../domain/ports/outbound/chat-repository.js";
import { AgentRepository } from "../../domain/ports/outbound/agent-repository.js";
import { Thread } from "../../domain/entities/thread.js";
import { AgentType } from "../../domain/entities/agent.js";
import { randomUUID } from "node:crypto";
import { HttpError } from "../../adapters/inbound/http/errors/http-error.js";

@Service()
export class CreateThreadUseCase {
  constructor(
    @Inject(CHAT_REPOSITORY)
    private readonly chatRepository: ChatRepository,
    @Inject(AGENT_REPOSITORY)
    private readonly agentRepository: AgentRepository,
  ) {}

  async execute(
    userId: string,
    agentId: string,
    title?: string,
  ): Promise<Thread> {
    const agent = await this.agentRepository.findById(agentId);
    if (!agent) throw new HttpError(404, "Agent not found");

    // Access control
    if (agent.type === AgentType.PRIVATE && agent.userId !== userId) {
      throw new HttpError(403, "Unauthorized access to private agent");
    }

    // Feature flag check
    if (!agent.configuration.enableThreads) {
      throw new HttpError(403, "Threading is disabled for this agent");
    }

    const thread: Thread = {
      id: randomUUID(),
      agentId,
      userId,
      title: title || "New Conversation",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.chatRepository.createThread(thread);
  }
}
