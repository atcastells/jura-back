import { Service, Inject } from "typedi";
import { MongoDBAdapter } from "./mongo-database-adapter.js";
import { ChatRepository } from "../../../../domain/ports/outbound/chat-repository.js";
import { Thread } from "../../../../domain/entities/thread.js";
import { ChatMessage } from "../../../../domain/entities/chat-message.js";
import {
  ThreadSchema,
  ChatMessageSchema,
  threadSchema,
  chatMessageSchema,
} from "./schemas/chat.schema.js";
import { ObjectId, WithId, Filter } from "mongodb";

@Service()
export class MongoChatRepository implements ChatRepository {
  constructor(
    @Inject(() => MongoDBAdapter)
    private readonly databaseConnection: MongoDBAdapter,
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...threadData } = thread;

    // Validate with Zod
    const validatedData = threadSchema.parse(threadData);

    const result = await this.threadCollection.insertOne(validatedData);

    return {
      ...validatedData,
      id: result.insertedId.toString(),
    };
  }

  async getThreads(userId: string, agentId: string): Promise<Thread[]> {
    const threads = await this.threadCollection
      .find({ userId, agentId })
      // eslint-disable-next-line unicorn/no-array-sort
      .sort({ updatedAt: -1 })
      .toArray();
    return threads.map((thread) => this.mapThread(thread));
  }

  async getThreadById(id: string): Promise<Thread | null> {
    if (!ObjectId.isValid(id)) return null;

    const thread = await this.threadCollection.findOne({
      _id: new ObjectId(id),
    } as Filter<ThreadSchema>);

    if (!thread) return null;

    return this.mapThread(thread);
  }

  async saveMessage(message: ChatMessage): Promise<ChatMessage> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...messageData } = message;

    // Validate with Zod
    const validatedData = chatMessageSchema.parse(messageData);

    const result = await this.messageCollection.insertOne(validatedData);

    // Update thread updatedAt
    if (ObjectId.isValid(message.threadId)) {
      await this.threadCollection.updateOne(
        { _id: new ObjectId(message.threadId) } as Filter<ThreadSchema>,
        { $set: { updatedAt: new Date() } },
      );
    }

    return {
      ...validatedData,
      id: result.insertedId.toString(),
    };
  }

  async getMessages(threadId: string): Promise<ChatMessage[]> {
    const messages = await this.messageCollection
      .find({ threadId })
      // eslint-disable-next-line unicorn/no-array-sort
      .sort({ createdAt: 1 }) // Oldest first for chat context
      .toArray();
    return messages.map((message) => this.mapMessage(message));
  }

  private mapThread(thread: WithId<ThreadSchema>): Thread {
    const { _id, ...rest } = thread;
    return {
      id: _id.toString(),
      ...rest,
    };
  }

  private mapMessage(message: WithId<ChatMessageSchema>): ChatMessage {
    const { _id, ...rest } = message;
    return {
      id: _id.toString(),
      ...rest,
    };
  }
}
