import { Service, Inject } from "typedi";
import { Profile, ProfileRole } from "../../domain/entities/profile.js";
import { ProfileRepository } from "../../domain/ports/outbound/profile-repository.js";
import { PROFILE_REPOSITORY } from "../../infrastructure/constants.js";
import { HttpError } from "../../adapters/inbound/http/errors/http-error.js";
import { ProfileCompletenessService } from "../../domain/services/profile-completeness.js";

export type UpdateRoleInput = Partial<Omit<ProfileRole, "id">>;

@Service()
export class UpdateRoleUseCase {
  constructor(
    @Inject(PROFILE_REPOSITORY)
    private readonly profileRepository: ProfileRepository,
  ) {}

  async execute(
    userId: string,
    roleId: string,
    input: UpdateRoleInput,
  ): Promise<Profile> {
    const profile = await this.profileRepository.findByUserId(userId);

    if (!profile) {
      throw new HttpError(404, "Profile not found");
    }

    const roleIndex = profile.roles.findIndex((role) => role.id === roleId);

    if (roleIndex === -1) {
      throw new HttpError(404, "Role not found");
    }

    // Update role
    profile.roles[roleIndex] = {
      ...profile.roles[roleIndex],
      ...input,
    };

    profile.updatedAt = new Date();

    // Recalculate completeness score
    const { score } = ProfileCompletenessService.calculate(profile);
    profile.completenessScore = score;

    const updatedProfile = await this.profileRepository.update(profile);
    return updatedProfile;
  }
}
