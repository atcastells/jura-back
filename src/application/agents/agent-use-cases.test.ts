import "reflect-metadata";
import { CreateAgentUseCase } from "../../application/agents/create-agent.use-case.js";
import { GetAgentUseCase } from "../../application/agents/get-agent.use-case.js";
import { ListAgentsUseCase } from "../../application/agents/list-agents.use-case.js";
import { Agent, AgentType } from "../../domain/entities/agent.js";
import { AgentRepository } from "../../domain/ports/outbound/agent-repository.js";

// Mock Agent Repository
const mockAgentRepository = {
  save: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn(),
  delete: jest.fn(),
};

describe("Agent Configuration System", () => {
  let createAgentUseCase: CreateAgentUseCase;
  let getAgentUseCase: GetAgentUseCase;
  let listAgentsUseCase: ListAgentsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    createAgentUseCase = new CreateAgentUseCase(
      mockAgentRepository as unknown as AgentRepository,
    );
    getAgentUseCase = new GetAgentUseCase(
      mockAgentRepository as unknown as AgentRepository,
    );
    listAgentsUseCase = new ListAgentsUseCase(
      mockAgentRepository as unknown as AgentRepository,
    );
  });

  it("should create a public agent with specific instructions", async () => {
    const input = {
      name: "Recruiter Bot",
      type: AgentType.PUBLIC,
      configuration: {
        systemPrompt: "Be professional and concise.",
        tone: "Professional",
        enableThreads: false,
      },
    };
    const userId = "user-123";

    const expectedAgent = {
      id: "agent-1",
      userId,
      name: input.name,
      type: input.type,
      status: "ACTIVE",
      configuration: input.configuration,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // The repository save check usually matches what is returned,
    // but the use case generates dates/ID before save or allows DB to do it.
    // In mongo-agent-repo, it receives the object without _id presumably if it's new?
    // Looking at create-agent-use-case, it sets id="" before save, or repo handles it.
    // Let's assume repo mocks returning the saved agent.
    mockAgentRepository.save.mockResolvedValue(expectedAgent);

    const result = await createAgentUseCase.execute(userId, input);

    expect(result).toBeDefined();
    expect(result.id).toBe("agent-1");
    expect(result.type).toBe(AgentType.PUBLIC);
    expect(result.configuration.systemPrompt).toBe(
      input.configuration.systemPrompt,
    );
    expect(mockAgentRepository.save).toHaveBeenCalledTimes(1);
  });

  it("should retrieve an agent by ID", async () => {
    const agentId = "agent-1";
    const mockAgent: Agent = {
      id: agentId,
      userId: "user-123",
      name: "Test Agent",
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

    const result = await getAgentUseCase.execute(agentId);

    expect(result).toEqual(mockAgent);
    expect(mockAgentRepository.findById).toHaveBeenCalledWith(agentId);
  });

  it("should list agents for a user", async () => {
    const userId = "user-123";
    const mockAgents: Agent[] = [
      {
        id: "1",
        userId,
        name: "A1",
        type: AgentType.PUBLIC,
        status: "ACTIVE" as any,
        configuration: { systemPrompt: "p", tone: "t", enableThreads: false },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockAgentRepository.findByUserId.mockResolvedValue(mockAgents);

    const result = await listAgentsUseCase.execute(userId);

    expect(result).toHaveLength(1);
    expect(mockAgentRepository.findByUserId).toHaveBeenCalledWith(userId);
  });
});
