import { Service, Inject } from "typedi";
import {
  Profile,
  ProfileBasics,
  ProfilePreferences,
} from "../../domain/entities/profile.js";
import { ProfileRepository } from "../../domain/ports/outbound/profile-repository.js";
import { PROFILE_REPOSITORY } from "../../infrastructure/constants.js";
import { HttpError } from "../../adapters/inbound/http/errors/http-error.js";
import { ProfileCompletenessService } from "../../domain/services/profile-completeness.js";

export interface UpdateMyProfileInput {
  basics?: Partial<ProfileBasics>;
  summary?: string;
  skills?: string[];
  preferences?: Partial<ProfilePreferences>;
}

@Service()
export class UpdateMyProfileUseCase {
  constructor(
    @Inject(PROFILE_REPOSITORY)
    private readonly profileRepository: ProfileRepository,
  ) {}

  async execute(userId: string, input: UpdateMyProfileInput): Promise<Profile> {
    const profile = await this.profileRepository.findByUserId(userId);

    if (!profile) {
      throw new HttpError(404, "Profile not found");
    }

    // Update fields
    if (input.basics) {
      profile.basics = {
        ...profile.basics,
        ...input.basics,
      };
    }

    if (input.summary !== undefined) {
      profile.summary = input.summary;
    }

    if (input.skills !== undefined) {
      profile.skills = input.skills;
    }

    if (input.preferences) {
      profile.preferences = {
        ...profile.preferences,
        ...input.preferences,
      };
    }

    // Update timestamp and completeness
    profile.updatedAt = new Date();
    const { score } = ProfileCompletenessService.calculate(profile);
    profile.completenessScore = score;

    const updatedProfile = await this.profileRepository.update(profile);
    return updatedProfile;
  }
}
