import { Service, Inject } from "typedi";
import { Agent } from "../../../../domain/entities/agent.js";
import { AgentRepository } from "../../../../domain/ports/outbound/agent-repository.js";
import { MongoDBAdapter } from "./mongo-database-adapter.js";
import { ObjectId, WithId, Filter } from "mongodb";
import { agentSchema, AgentSchema } from "./schemas/agent.schema.js";

@Service()
export class MongoAgentRepository implements AgentRepository {
  constructor(
    @Inject(() => MongoDBAdapter)
    private readonly databaseConnection: MongoDBAdapter,
  ) {}

  private get collection() {
    return this.databaseConnection.getDb().collection<AgentSchema>("agents");
  }

  async save(agent: Agent): Promise<Agent> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...agentData } = agent;

    // Validate with Zod
    const validatedData = agentSchema.parse(agentData);

    const result = await this.collection.insertOne(validatedData);

    return {
      ...validatedData,
      id: result.insertedId.toString(),
    };
  }

  async findById(id: string): Promise<Agent | undefined> {
    if (!ObjectId.isValid(id)) return undefined;

    const agent = await this.collection.findOne({
      _id: new ObjectId(id),
    } as Filter<AgentSchema>);

    if (!agent) return undefined;

    return this.mapAgent(agent);
  }

  async findByUserId(userId: string): Promise<Agent[]> {
    const agents = await this.collection.find({ userId }).toArray();
    return agents.map((agent) => this.mapAgent(agent));
  }

  async delete(id: string): Promise<void> {
    if (!ObjectId.isValid(id)) return;

    await this.collection.deleteOne({
      _id: new ObjectId(id),
    } as Filter<AgentSchema>);
  }

  private mapAgent(agent: WithId<AgentSchema>): Agent {
    const { _id, ...rest } = agent;
    return {
      id: _id.toString(),
      ...rest,
    };
  }
}
