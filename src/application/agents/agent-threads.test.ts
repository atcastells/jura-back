import "reflect-metadata";
import { ChatWithAgentUseCase } from "../../application/agents/chat-with-agent.use-case.js";
import { CreateThreadUseCase } from "../../application/chat/create-thread.use-case.js";
import { ListThreadsUseCase } from "../../application/chat/list-threads.use-case.js";
import { GetThreadHistoryUseCase } from "../../application/chat/get-thread-history.use-case.js";
import { Agent, AgentType } from "../../domain/entities/agent.js";
import { Thread } from "../../domain/entities/thread.js";
import { ChatMessage, ChatRole } from "../../domain/entities/chat-message.js";
import { AgentRepository } from "../../domain/ports/outbound/agent-repository.js";
import { ChatRepository } from "../../domain/ports/outbound/chat-repository.js";
import { ConversationAgentFactory } from "../../adapters/inbound/primary/agents/conversation-agent-factory.js";
import { AIMessage } from "@langchain/core/messages";

// Mocks
const mockAgentRepository = {
  findById: jest.fn(),
};
const mockChatRepository = {
  createThread: jest.fn(),
  getThreads: jest.fn(),
  getThreadById: jest.fn(),
  saveMessage: jest.fn(),
  getMessages: jest.fn(),
};
const mockConversationAgentFactory = {
  buildWithSystemPrompt: jest.fn(),
};

describe("Chat Threads & History", () => {
  let chatWithAgentUseCase: ChatWithAgentUseCase;
  let createThreadUseCase: CreateThreadUseCase;
  let listThreadsUseCase: ListThreadsUseCase;
  let getThreadHistoryUseCase: GetThreadHistoryUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    chatWithAgentUseCase = new ChatWithAgentUseCase(
      mockAgentRepository as unknown as AgentRepository,
      mockChatRepository as unknown as ChatRepository,
      mockConversationAgentFactory as unknown as ConversationAgentFactory,
    );
    createThreadUseCase = new CreateThreadUseCase(
      mockChatRepository as unknown as ChatRepository,
      mockAgentRepository as unknown as AgentRepository,
    );
    listThreadsUseCase = new ListThreadsUseCase(
      mockChatRepository as unknown as ChatRepository,
    );
    getThreadHistoryUseCase = new GetThreadHistoryUseCase(
      mockChatRepository as unknown as ChatRepository,
    );
  });

  const agentWithThreads: Agent = {
    id: "agent-threads",
    userId: "user-1",
    name: "Threaded Bot",
    type: AgentType.PRIVATE,
    status: "ACTIVE" as any,
    configuration: { systemPrompt: "test", tone: "test", enableThreads: true },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const agentNoThreads: Agent = {
    ...agentWithThreads,
    id: "agent-nothreads",
    configuration: { systemPrompt: "test", tone: "test", enableThreads: false },
  };

  describe("Thread Management", () => {
    it("should create a thread if enabled", async () => {
      mockAgentRepository.findById.mockResolvedValue(agentWithThreads);
      mockChatRepository.createThread.mockImplementation((t) =>
        Promise.resolve(t),
      );

      const thread = await createThreadUseCase.execute(
        "user-1",
        "agent-threads",
        "My Chat",
      );

      expect(thread.title).toBe("My Chat");
      expect(mockChatRepository.createThread).toHaveBeenCalled();
    });

    it("should throw if threads disabled", async () => {
      mockAgentRepository.findById.mockResolvedValue(agentNoThreads);
      await expect(
        createThreadUseCase.execute("user-1", "agent-nothreads"),
      ).rejects.toThrow("Threading is disabled");
    });

    it("should list threads", async () => {
      const mockThreads = [{ id: "t1" }, { id: "t2" }];
      mockChatRepository.getThreads.mockResolvedValue(mockThreads);

      const result = await listThreadsUseCase.execute(
        "user-1",
        "agent-threads",
      );
      expect(result).toEqual(mockThreads);
      expect(mockChatRepository.getThreads).toHaveBeenCalledWith(
        "user-1",
        "agent-threads",
      );
    });

    it("should get thread history", async () => {
      const mockThread: Thread = {
        id: "thread-1",
        agentId: "agent-threads",
        userId: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockChatRepository.getThreadById.mockResolvedValue(mockThread);

      const mockMsgs = [{ id: "m1", content: "hi" }];
      mockChatRepository.getMessages.mockResolvedValue(mockMsgs);

      const result = await getThreadHistoryUseCase.execute(
        "user-1",
        "thread-1",
      );
      expect(result).toEqual(mockMsgs);
    });

    it("should deny access to other user's thread history", async () => {
      const mockThread: Thread = {
        id: "thread-1",
        agentId: "agent-threads",
        userId: "other-user", // Different user
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockChatRepository.getThreadById.mockResolvedValue(mockThread);

      await expect(
        getThreadHistoryUseCase.execute("user-1", "thread-1"),
      ).rejects.toThrow("Unauthorized");
    });
  });

  describe("Chat with History", () => {
    it("should load history and save new messages", async () => {
      mockAgentRepository.findById.mockResolvedValue(agentWithThreads);

      const mockInvoke = jest
        .fn()
        .mockResolvedValue({ messages: [new AIMessage("AI Reply")] });
      mockConversationAgentFactory.buildWithSystemPrompt.mockReturnValue({
        invoke: mockInvoke,
      });

      const mockThread: Thread = {
        id: "thread-1",
        agentId: "agent-threads",
        userId: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockChatRepository.getThreadById.mockResolvedValue(mockThread);

      const history: ChatMessage[] = [
        {
          id: "msg-1",
          threadId: "thread-1",
          role: ChatRole.USER,
          content: "Hello",
          createdAt: new Date(),
        },
        {
          id: "msg-2",
          threadId: "thread-1",
          role: ChatRole.ASSISTANT,
          content: "Hi",
          createdAt: new Date(),
        },
      ];
      mockChatRepository.getMessages.mockResolvedValue(history);

      // Execute
      await chatWithAgentUseCase.execute({
        agentId: "agent-threads",
        userId: "user-1",
        message: "How are you?",
        threadId: "thread-1",
      });

      // Verify History Loading
      expect(mockChatRepository.getMessages).toHaveBeenCalledWith("thread-1");

      // Verify agent factory was called with tools
      expect(mockConversationAgentFactory.buildWithSystemPrompt).toHaveBeenCalled();

      // Verify chat history was passed to invoke
      const invokeArgs = mockInvoke.mock.calls[0][0];
      expect(invokeArgs.input).toBe("How are you?");
      expect(invokeArgs.chat_history).toHaveLength(2);
      expect(invokeArgs.chat_history[0].content).toBe("Hello");
      expect(invokeArgs.chat_history[1].content).toBe("Hi");

      // Verify Saving
      expect(mockChatRepository.saveMessage).toHaveBeenCalledTimes(2); // User msg + AI reply
    });
  });
});
