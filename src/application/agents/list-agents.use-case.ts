import { Service, Inject } from "typedi";
import { Agent } from "../../domain/entities/agent.js";
import { AgentRepository } from "../../domain/ports/outbound/agent-repository.js";
import { AGENT_REPOSITORY } from "../../infrastructure/constants.js";

@Service()
export class ListAgentsUseCase {
  constructor(
    @Inject(AGENT_REPOSITORY)
    private readonly agentRepository: AgentRepository,
  ) {}

  async execute(userId: string): Promise<Agent[]> {
    return this.agentRepository.findByUserId(userId);
  }
}
