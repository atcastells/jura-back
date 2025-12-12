import { Service, Inject } from 'typedi';
import { AuthRepository } from '../../../../domain/auth/AuthRepository';
import { User } from '../../../../domain/user/User';
import { MongoDBAdapter } from './MongoDBAdapter';
import { ObjectId } from 'mongodb';

@Service()
export class MongoUserRepository implements AuthRepository {
    constructor(
        @Inject() private dbConnection: MongoDBAdapter
    ) { }

    private get collection() {
        return this.dbConnection.getDb().collection<User>('users');
    }

    async findByEmail(email: string): Promise<User | null> {
        const doc = await this.collection.findOne({ email });
        if (!doc) return null;
        return this.mapDocument(doc);
    }

    // New method for Supabase ID lookup
    async findByAuthId(authId: string): Promise<User | null> {
        const doc = await this.collection.findOne({ authId });
        if (!doc) return null;
        return this.mapDocument(doc);
    }

    async create(user: Omit<User, 'id'>): Promise<User> {
        const result = await this.collection.insertOne(user as any);
        return {
            ...user,
            id: result.insertedId.toString(),
        } as User;
    }

    async findById(id: string): Promise<User | null> {
        if (!ObjectId.isValid(id)) return null;
        const doc = await this.collection.findOne({ _id: new ObjectId(id) as any });
        if (!doc) return null;
        return this.mapDocument(doc);
    }

    private mapDocument(doc: any): User {
        const { _id, ...rest } = doc;
        return {
            id: _id.toString(),
            ...rest,
        };
    }
}
