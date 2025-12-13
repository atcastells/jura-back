import { Service, Inject } from "typedi";
import { MongoDatabaseConnection } from "./mongo-database-connection.js";
import { ChatRepository } from "../../../../domain/ports/outbound/chat-repository.js";
import { Thread } from "../../../../domain/entities/thread.js";
import { ChatMessage } from "../../../../domain/entities/chat-message.js";
import { ThreadSchema, ChatMessageSchema } from "./schemas/chat.schema.js";

@Service()
export class MongoChatRepository implements ChatRepository {
  constructor(
    @Inject(() => MongoDatabaseConnection)
    private readonly databaseConnection: MongoDatabaseConnection,
  ) {}

  private get threadCollection() {
    return this.databaseConnection.getDb().collection<ThreadSchema>("threads");
  }

  private get messageCollection() {
    return this.databaseConnection
      .getDb()
      .collection<ChatMessageSchema>("chat_messages");
  }

  async createThread(thread: Thread): Promise<Thread> {
    await this.threadCollection.insertOne(thread);
    return thread;
  }

  async getThreads(userId: string, agentId: string): Promise<Thread[]> {
    const threads = await this.threadCollection
      .find({ userId, agentId })
      // eslint-disable-next-line unicorn/no-array-sort
      .sort({ updatedAt: -1 })
      .toArray();
    return threads;
  }

  async getThreadById(id: string): Promise<Thread | null> {
    const thread = await this.threadCollection.findOne({ id });
    return thread;
  }

  async saveMessage(message: ChatMessage): Promise<ChatMessage> {
    await this.messageCollection.insertOne(message);

    // Update thread updatedAt
    await this.threadCollection.updateOne(
      { id: message.threadId },
      { $set: { updatedAt: new Date() } },
    );

    return message;
  }

  async getMessages(threadId: string): Promise<ChatMessage[]> {
    const messages = await this.messageCollection
      .find({ threadId })
      // eslint-disable-next-line unicorn/no-array-sort
      .sort({ createdAt: 1 }) // Oldest first for chat context
      .toArray();
    return messages;
  }
}
