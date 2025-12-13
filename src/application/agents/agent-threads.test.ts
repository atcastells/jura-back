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
import { RetrieveContextUseCase } from "../../application/services/retrieve-context.use-case.js";
import { LangChainGeminiAdapter } from "../../adapters/outbound/external-services/lang-chain-gemini-adapter.js";
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
const mockRetrieveContext = {
  execute: jest.fn(),
};
const mockLlm = {
  invoke: jest.fn(),
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
      mockRetrieveContext as unknown as RetrieveContextUseCase,
      mockLlm as unknown as LangChainGeminiAdapter,
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
      mockRetrieveContext.execute.mockResolvedValue([]);
      mockLlm.invoke.mockResolvedValue(new AIMessage("AI Reply"));

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

      // Verify Logic passed history to LLM
      // We can check the messages passed to LLM invoke
      const llmCalls = mockLlm.invoke.mock.calls[0][0];
      // System + History (User, AI) + New User Message = 4 messages
      expect(llmCalls).toHaveLength(4);
      expect(llmCalls[1].content).toBe("Hello");
      expect(llmCalls[2].content).toBe("Hi");
      expect(llmCalls[3].content).toBe("How are you?");

      // Verify Saving
      expect(mockChatRepository.saveMessage).toHaveBeenCalledTimes(2); // User msg + AI reply
    });
  });
});
