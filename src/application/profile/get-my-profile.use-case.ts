import { Service, Inject } from "typedi";
import { Profile } from "../../domain/entities/profile.js";
import { ProfileRepository } from "../../domain/ports/outbound/profile-repository.js";
import { PROFILE_REPOSITORY } from "../../infrastructure/constants.js";
import { HttpError } from "../../adapters/inbound/http/errors/http-error.js";

@Service()
export class GetMyProfileUseCase {
  constructor(
    @Inject(PROFILE_REPOSITORY)
    private readonly profileRepository: ProfileRepository,
  ) {}

  async execute(userId: string): Promise<Profile> {
    const profile = await this.profileRepository.findByUserId(userId);

    if (!profile) {
      throw new HttpError(404, "Profile not found");
    }

    return profile;
  }
}
