import { Service, Inject } from "typedi";
import { Profile } from "../../../../domain/entities/profile.js";
import { ProfileRepository } from "../../../../domain/ports/outbound/profile-repository.js";
import { MongoDBAdapter } from "./mongo-database-adapter.js";
import { ObjectId, WithId, Filter } from "mongodb";
import { profileSchema, ProfileSchema } from "./schemas/profile.schema.js";

@Service()
export class MongoProfileRepository implements ProfileRepository {
  constructor(
    @Inject(() => MongoDBAdapter)
    private readonly databaseConnection: MongoDBAdapter,
  ) {}

  private get collection() {
    return this.databaseConnection
      .getDb()
      .collection<ProfileSchema>("profiles");
  }

  async save(profile: Profile): Promise<Profile> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...profileData } = profile;

    // Validate with Zod
    const validatedData = profileSchema.parse(profileData);

    const result = await this.collection.insertOne(validatedData);

    return {
      ...validatedData,
      id: result.insertedId.toString(),
    };
  }

  async findById(id: string): Promise<Profile | undefined> {
    if (!ObjectId.isValid(id)) return undefined;

    const profile = await this.collection.findOne({
      _id: new ObjectId(id),
    } as Filter<ProfileSchema>);

    if (!profile) return undefined;

    return this.mapProfile(profile);
  }

  async findByUserId(userId: string): Promise<Profile | undefined> {
    const profile = await this.collection.findOne({ userId });

    if (!profile) return undefined;

    return this.mapProfile(profile);
  }

  async update(profile: Profile): Promise<Profile> {
    if (!ObjectId.isValid(profile.id)) {
      throw new Error("Invalid profile ID");
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...profileData } = profile;

    // Validate with Zod
    const validatedData = profileSchema.parse(profileData);

    await this.collection.updateOne(
      { _id: new ObjectId(profile.id) } as Filter<ProfileSchema>,
      { $set: validatedData },
    );

    return profile;
  }

  async delete(id: string): Promise<void> {
    if (!ObjectId.isValid(id)) return;

    await this.collection.deleteOne({
      _id: new ObjectId(id),
    } as Filter<ProfileSchema>);
  }

  private mapProfile(profile: WithId<ProfileSchema>): Profile {
    const { _id, ...rest } = profile;
    return {
      id: _id.toString(),
      ...rest,
    };
  }
}
