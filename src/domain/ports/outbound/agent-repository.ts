import { Agent } from "../../entities/agent.js";

export interface AgentRepository {
  save(agent: Agent): Promise<Agent>;
  findById(id: string): Promise<Agent | undefined>;
  findByUserId(userId: string): Promise<Agent[]>;
  delete(id: string): Promise<void>;
}
