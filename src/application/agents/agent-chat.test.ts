import "reflect-metadata";
import { ChatWithAgentUseCase } from "../../application/agents/chat-with-agent.use-case.js";
import { Agent, AgentType } from "../../domain/entities/agent.js";
import { AgentRepository } from "../../domain/ports/outbound/agent-repository.js";
import { ChatRepository } from "../../domain/ports/outbound/chat-repository.js";
import { RetrieveContextUseCase } from "../../application/services/retrieve-context.use-case.js";
import { LangChainGeminiAdapter } from "../../adapters/outbound/external-services/lang-chain-gemini-adapter.js";
import { AIMessage } from "@langchain/core/messages";
import { DocumentChunk } from "../../domain/entities/document-chunk.js";

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

describe("Chat With Agent", () => {
  let chatWithAgentUseCase: ChatWithAgentUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    chatWithAgentUseCase = new ChatWithAgentUseCase(
      mockAgentRepository as unknown as AgentRepository,
      mockChatRepository as unknown as ChatRepository,
      mockRetrieveContext as unknown as RetrieveContextUseCase,
      mockLlm as unknown as LangChainGeminiAdapter,
    );
  });

  it("should generate a response using agent instructions and context", async () => {
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

    const mockChunks: DocumentChunk[] = [
      {
        id: "chunk-1",
        documentId: "doc-1",
        userId,
        content: "To create a user, POST to /auth/signup.",
        metadata: { source: "manual.pdf" },
        chunkIndex: 0,
        embedding: [],
      },
    ];

    // Setup Mocks
    mockAgentRepository.findById.mockResolvedValue(mockAgent);
    mockRetrieveContext.execute.mockResolvedValue(mockChunks);
    mockLlm.invoke.mockResolvedValue(
      new AIMessage("Arrr! POST to /auth/signup!"),
    );

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
    expect(mockRetrieveContext.execute).toHaveBeenCalledWith(userId, message);

    // Verify LLM prompt construction (indirectly checking if instructions were used)
    const llmCalls = mockLlm.invoke.mock.calls[0][0];
    const systemMessage = llmCalls.find((m: any) => m._getType() === "system");
    expect(systemMessage.content).toContain(instructions);
    expect(systemMessage.content).toContain(tone);
    expect(systemMessage.content).toContain(
      "To create a user, POST to /auth/signup.",
    );
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
    ).rejects.toThrow("Agente no encontrado");
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
