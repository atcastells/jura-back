import { Service, Inject } from "typedi";
import { Profile, ProfileRole } from "../../domain/entities/profile.js";
import { ProfileRepository } from "../../domain/ports/outbound/profile-repository.js";
import { PROFILE_REPOSITORY } from "../../infrastructure/constants.js";
import { HttpError } from "../../adapters/inbound/http/errors/http-error.js";
import { ProfileCompletenessService } from "../../domain/services/profile-completeness.js";
import { randomUUID } from "node:crypto";

export type AddRoleInput = Omit<ProfileRole, "id">;

@Service()
export class AddRoleUseCase {
  constructor(
    @Inject(PROFILE_REPOSITORY)
    private readonly profileRepository: ProfileRepository,
  ) {}

  async execute(userId: string, input: AddRoleInput): Promise<Profile> {
    const profile = await this.profileRepository.findByUserId(userId);

    if (!profile) {
      throw new HttpError(404, "Profile not found");
    }

    const newRole: ProfileRole = {
      id: randomUUID(),
      ...input,
    };

    profile.roles.push(newRole);
    profile.updatedAt = new Date();

    // Recalculate completeness score
    const { score } = ProfileCompletenessService.calculate(profile);
    profile.completenessScore = score;

    const updatedProfile = await this.profileRepository.update(profile);
    return updatedProfile;
  }
}
