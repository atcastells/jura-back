import { Profile } from "../../entities/profile.js";

export interface ProfileRepository {
  save(profile: Profile): Promise<Profile>;
  findById(id: string): Promise<Profile | undefined>;
  findByUserId(userId: string): Promise<Profile | undefined>;
  update(profile: Profile): Promise<Profile>;
  delete(id: string): Promise<void>;
}
