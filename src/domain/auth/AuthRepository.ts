import { User } from '../user/User';

export interface AuthRepository {
    findByEmail(email: string): Promise<User | null>;
    findByAuthId(authId: string): Promise<User | null>;
    create(user: Omit<User, 'id'>): Promise<User>;
    findById(id: string): Promise<User | null>;
}
