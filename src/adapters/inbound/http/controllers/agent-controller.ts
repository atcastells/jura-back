import { Service, Inject } from "typedi";
import { Request, Response } from "express";
import { CreateAgentUseCase } from "../../../../application/agents/create-agent.use-case.js";
import { ListAgentsUseCase } from "../../../../application/agents/list-agents.use-case.js";
import { GetAgentUseCase } from "../../../../application/agents/get-agent.use-case.js";
import { z } from "zod";
import { AgentType } from "../../../../domain/entities/agent.js";
import { AuthenticatedRequest } from "../middlewares/auth-middleware.js";

const createAgentSchema = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(AgentType),
  instructions: z.string(),
  tone: z.string(),
});

@Service()
export class AgentController {
  constructor(
    @Inject(() => CreateAgentUseCase)
    private readonly createAgentUseCase: CreateAgentUseCase,
    @Inject(() => ListAgentsUseCase)
    private readonly listAgentsUseCase: ListAgentsUseCase,
    @Inject(() => GetAgentUseCase)
    private readonly getAgentUseCase: GetAgentUseCase,
  ) {}

  async createAgent(request: Request, response: Response): Promise<void> {
    const authRequest = request as AuthenticatedRequest;
    if (!authRequest.user) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const input = createAgentSchema.parse(request.body);
      const agent = await this.createAgentUseCase.execute(
        authRequest.user.id,
        input,
      );
      response.status(201).json(agent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        response.status(400).json({ error: error.issues });
      } else {
        console.error("Error creating agent:", error);
        response.status(500).json({ error: "Internal Server Error" });
      }
    }
  }

  async listAgents(request: Request, response: Response): Promise<void> {
    const authRequest = request as AuthenticatedRequest;
    if (!authRequest.user) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }

    const agents = await this.listAgentsUseCase.execute(authRequest.user.id);
    response.json(agents);
  }

  async getAgent(request: Request, response: Response): Promise<void> {
    const agentId = request.params.id;
    const agent = await this.getAgentUseCase.execute(agentId);

    if (!agent) {
      response.status(404).json({ error: "Agent not found" });
      return;
    }

    // Optional: Add authorization check here if relevant

    response.json(agent);
  }
}
