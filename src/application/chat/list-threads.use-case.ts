import { Service, Inject } from "typedi";
import { CHAT_REPOSITORY } from "../../infrastructure/constants.js";
import { ChatRepository } from "../../domain/ports/outbound/chat-repository.js";
import { Thread } from "../../domain/entities/thread.js";

@Service()
export class ListThreadsUseCase {
  constructor(
    @Inject(CHAT_REPOSITORY)
    private readonly chatRepository: ChatRepository,
  ) {}

  async execute(userId: string, agentId: string): Promise<Thread[]> {
    return this.chatRepository.getThreads(userId, agentId);
  }
}
