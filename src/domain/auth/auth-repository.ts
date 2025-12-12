import { User } from "../user/user.js";

export interface AuthRepository {
  findByEmail(email: string): Promise<User | undefined>;
  findByAuthId(authId: string): Promise<User | undefined>;
  create(user: Omit<User, "id">): Promise<User>;
  findById(id: string): Promise<User | undefined>;
}
