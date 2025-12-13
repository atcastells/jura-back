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
      instructions: "Be professional and concise.",
      tone: "Professional",
    };
    const userId = "user-123";

    mockAgentRepository.save.mockResolvedValue({
      id: "agent-1",
      userId,
      ...input,
      status: "ACTIVE",
      configuration: {
        systemPrompt: input.instructions,
        tone: input.tone,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await createAgentUseCase.execute(userId, input);

    expect(result).toBeDefined();
    expect(result.id).toBe("agent-1");
    expect(result.type).toBe(AgentType.PUBLIC);
    expect(result.configuration.systemPrompt).toBe(input.instructions);
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
        configuration: { systemPrompt: "p", tone: "t" },
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
