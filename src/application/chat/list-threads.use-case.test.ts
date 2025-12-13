import { ListThreadsUseCase } from "./list-threads.use-case.js";
import { ChatRepository } from "../../domain/ports/outbound/chat-repository.js";
import { Thread } from "../../domain/entities/thread.js";

describe("ListThreadsUseCase", () => {
  let useCase: ListThreadsUseCase;
  let mockChatRepository: jest.Mocked<ChatRepository>;

  const mockThreads: Thread[] = [
    {
      id: "thread1",
      agentId: "agent123",
      userId: "user123",
      title: "First Conversation",
      createdAt: new Date("2023-01-01"),
      updatedAt: new Date("2023-01-01"),
    },
    {
      id: "thread2",
      agentId: "agent123",
      userId: "user123",
      title: "Second Conversation",
      createdAt: new Date("2023-01-02"),
      updatedAt: new Date("2023-01-02"),
    },
  ];

  beforeEach(() => {
    mockChatRepository = {
      createThread: jest.fn(),
      getThreads: jest.fn(),
      getThreadById: jest.fn(),
      saveMessage: jest.fn(),
      getMessages: jest.fn(),
    } as jest.Mocked<ChatRepository>;

    useCase = new ListThreadsUseCase(mockChatRepository);
  });

  describe("execute", () => {
    it("should return all threads for a user and agent", async () => {
      const userId = "user123";
      const agentId = "agent123";

      mockChatRepository.getThreads.mockResolvedValue(mockThreads);

      const result = await useCase.execute(userId, agentId);

      expect(mockChatRepository.getThreads).toHaveBeenCalledWith(
        userId,
        agentId,
      );
      expect(result).toEqual(mockThreads);
      expect(result).toHaveLength(2);
    });

    it("should return empty array when user has no threads", async () => {
      const userId = "user456";
      const agentId = "agent123";

      mockChatRepository.getThreads.mockResolvedValue([]);

      const result = await useCase.execute(userId, agentId);

      expect(mockChatRepository.getThreads).toHaveBeenCalledWith(
        userId,
        agentId,
      );
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it("should throw error when repository fails", async () => {
      const userId = "user123";
      const agentId = "agent123";
      const error = new Error("Database error");

      mockChatRepository.getThreads.mockRejectedValue(error);

      await expect(useCase.execute(userId, agentId)).rejects.toThrow(
        "Database error",
      );
    });
  });
});
