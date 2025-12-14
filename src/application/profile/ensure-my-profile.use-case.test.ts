import { EnsureMyProfileUseCase } from "./ensure-my-profile.use-case.js";
import { ProfileRepository } from "../../domain/ports/outbound/profile-repository.js";
import { AuthRepository } from "../../domain/auth/auth-repository.js";
import { Profile } from "../../domain/entities/profile.js";
import { User } from "../../domain/user/user.js";

describe("EnsureMyProfileUseCase", () => {
  let useCase: EnsureMyProfileUseCase;
  let mockProfileRepository: jest.Mocked<ProfileRepository>;
  let mockAuthRepository: jest.Mocked<AuthRepository>;

  const mockUser: User = {
    id: "user123",
    email: "test@example.com",
    authId: "auth123",
    organizationId: "org123",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProfile: Profile = {
    id: "profile123",
    userId: "user123",
    basics: {
      email: "test@example.com",
    },
    roles: [],
    completenessScore: 8,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockProfileRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<ProfileRepository>;

    mockAuthRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByAuthId: jest.fn(),
      create: jest.fn(),
    } as jest.Mocked<AuthRepository>;

    useCase = new EnsureMyProfileUseCase(
      mockProfileRepository,
      mockAuthRepository,
    );
  });

  describe("execute", () => {
    it("should return existing profile if found", async () => {
      mockProfileRepository.findByUserId.mockResolvedValue(mockProfile);

      const result = await useCase.execute("user123");

      expect(result).toEqual(mockProfile);
      expect(mockProfileRepository.findByUserId).toHaveBeenCalledWith(
        "user123",
      );
      expect(mockProfileRepository.save).not.toHaveBeenCalled();
    });

    it("should create new profile if not found", async () => {
      // eslint-disable-next-line unicorn/no-useless-undefined
      mockProfileRepository.findByUserId.mockResolvedValue(undefined);
      mockAuthRepository.findById.mockResolvedValue(mockUser);

      const newProfile = {
        ...mockProfile,
        id: "newprofile123",
      };
      mockProfileRepository.save.mockResolvedValue(newProfile);

      const result = await useCase.execute("user123");

      expect(mockProfileRepository.findByUserId).toHaveBeenCalledWith(
        "user123",
      );
      expect(mockAuthRepository.findById).toHaveBeenCalledWith("user123");
      expect(mockProfileRepository.save).toHaveBeenCalled();
      expect(result.userId).toBe("user123");
      expect(result.basics.email).toBe("test@example.com");
    });

    it("should create profile with empty email if user not found", async () => {
      // eslint-disable-next-line unicorn/no-useless-undefined
      mockProfileRepository.findByUserId.mockResolvedValue(undefined);
      // eslint-disable-next-line unicorn/no-useless-undefined
      mockAuthRepository.findById.mockResolvedValue(undefined);

      const newProfile = {
        ...mockProfile,
        basics: { email: "" },
      };
      mockProfileRepository.save.mockResolvedValue(newProfile);

      const result = await useCase.execute("user123");

      expect(result.basics.email).toBe("");
      expect(mockProfileRepository.save).toHaveBeenCalled();
    });
  });
});
