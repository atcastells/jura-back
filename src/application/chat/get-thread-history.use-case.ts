import { Service, Inject } from "typedi";
import { CHAT_REPOSITORY } from "../../infrastructure/constants.js";
import { ChatRepository } from "../../domain/ports/outbound/chat-repository.js";
import { ChatMessage } from "../../domain/entities/chat-message.js";
import { HttpError } from "../../adapters/inbound/http/errors/http-error.js";

@Service()
export class GetThreadHistoryUseCase {
  constructor(
    @Inject(CHAT_REPOSITORY)
    private readonly chatRepository: ChatRepository,
  ) {}

  async execute(userId: string, threadId: string): Promise<ChatMessage[]> {
    const thread = await this.chatRepository.getThreadById(threadId);
    if (!thread) throw new HttpError(404, "Thread not found");

    if (thread.userId !== userId) {
      throw new HttpError(403, "Unauthorized access to thread");
    }

    return this.chatRepository.getMessages(threadId);
  }
}
