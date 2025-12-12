import { Service, Inject } from "typedi";
import { AuthRepository } from "../../../../domain/auth/auth-repository.js";
import { User } from "../../../../domain/user/user.js";
import { MongoDBAdapter } from "./mongo-database-adapter.js";
import { ObjectId, WithId, Filter } from "mongodb";

// MongoDB document type (without id field, uses _id)
type UserDocument = Omit<User, "id">;

@Service()
export class MongoUserRepository implements AuthRepository {
  constructor(
    @Inject(() => MongoDBAdapter)
    private readonly databaseConnection: MongoDBAdapter,
  ) {}

  private get collection() {
    return this.databaseConnection.getDb().collection<UserDocument>("users");
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const document = await this.collection.findOne({ email });
    if (!document) return undefined;
    return this.mapDocument(document);
  }

  // New method for Supabase ID lookup
  async findByAuthId(authId: string): Promise<User | undefined> {
    const document = await this.collection.findOne({ authId });
    if (!document) return undefined;
    return this.mapDocument(document);
  }

  async create(user: Omit<User, "id">): Promise<User> {
    const result = await this.collection.insertOne(user);
    return {
      ...user,
      id: result.insertedId.toString(),
    };
  }

  async findById(id: string): Promise<User | undefined> {
    if (!ObjectId.isValid(id)) return undefined;
    const document = await this.collection.findOne({
      _id: new ObjectId(id),
    } as Filter<UserDocument>);
    if (!document) return undefined;
    return this.mapDocument(document);
  }

  private mapDocument(document: WithId<UserDocument>): User {
    const { _id, ...rest } = document;
    return {
      id: _id.toString(),
      ...rest,
    };
  }
}
