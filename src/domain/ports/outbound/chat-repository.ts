import { Thread } from "../../entities/thread.js";
import { ChatMessage } from "../../entities/chat-message.js";

export interface ChatRepository {
  createThread(thread: Thread): Promise<Thread>;
  getThreads(userId: string, agentId: string): Promise<Thread[]>;
  getThreadById(id: string): Promise<Thread | null>;

  saveMessage(message: ChatMessage): Promise<ChatMessage>;
  getMessages(threadId: string): Promise<ChatMessage[]>;
}
