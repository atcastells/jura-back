import "reflect-metadata";
import { ChatWithAgentUseCase } from "../../application/agents/chat-with-agent.use-case.js";
import { Agent, AgentType } from "../../domain/entities/agent.js";
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

describe("Chat With Agent", () => {
  let chatWithAgentUseCase: ChatWithAgentUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    chatWithAgentUseCase = new ChatWithAgentUseCase(
      mockAgentRepository as unknown as AgentRepository,
      mockChatRepository as unknown as ChatRepository,
      mockConversationAgentFactory as unknown as ConversationAgentFactory,
    );
  });

  it("should generate a response using agent instructions", async () => {
    // Setup Data
    const agentId = "agent-1";
    const userId = "user-123";
    const message = "How do I create a user?";
    const instructions = "You are a helpful pirate.";
    const tone = "Pirate";

    const mockAgent: Agent = {
      id: agentId,
      userId,
      name: "Pirate Bot",
      type: AgentType.PRIVATE,
      status: "ACTIVE" as any,
      configuration: { systemPrompt: instructions, tone, enableThreads: false },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Setup Mocks
    mockAgentRepository.findById.mockResolvedValue(mockAgent);

    const mockInvoke = jest
      .fn()
      .mockResolvedValue({ messages: [new AIMessage("Arrr! POST to /auth/signup!")] });
    mockConversationAgentFactory.buildWithSystemPrompt.mockReturnValue({
      invoke: mockInvoke,
    });

    // Execute
    const response = await chatWithAgentUseCase.execute({
      agentId,
      userId,
      message,
    });

    // Verification
    expect(response).toBe("Arrr! POST to /auth/signup!");

    // Verify mocks called correctly
    expect(mockAgentRepository.findById).toHaveBeenCalledWith(agentId);

    expect(mockConversationAgentFactory.buildWithSystemPrompt).toHaveBeenCalled();

    const buildArgs = mockConversationAgentFactory.buildWithSystemPrompt.mock
      .calls[0][0];
    expect(buildArgs.systemPrompt).toContain(instructions);
    expect(buildArgs.systemPrompt).toContain(tone);
    expect(buildArgs.tools).toHaveLength(1);

    expect(mockInvoke).toHaveBeenCalledWith({
      input: message,
      chat_history: [],
    });
  });

  it("should throw error if agent not found", async () => {
    // eslint-disable-next-line unicorn/no-null
    mockAgentRepository.findById.mockResolvedValue(null);

    await expect(
      chatWithAgentUseCase.execute({
        agentId: "unknown",
        userId: "user-1",
        message: "hello",
      }),
    ).rejects.toThrow("Agent not found");
  });

  it("should throw error if unauthorized access to private agent", async () => {
    const mockAgent: Agent = {
      id: "agent-1",
      userId: "owner-user",
      name: "Pirate Bot",
      type: AgentType.PRIVATE,
      status: "ACTIVE" as any,
      configuration: {
        systemPrompt: "test",
        tone: "test",
        enableThreads: false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockAgentRepository.findById.mockResolvedValue(mockAgent);

    await expect(
      chatWithAgentUseCase.execute({
        agentId: "agent-1",
        userId: "other-user", // Different user
        message: "hello",
      }),
    ).rejects.toThrow("Unauthorized access to private agent");
  });
});
