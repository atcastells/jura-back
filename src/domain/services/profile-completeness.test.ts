import { ProfileCompletenessService } from "./profile-completeness.js";
import { Profile } from "../entities/profile.js";

describe("ProfileCompletenessService", () => {
  const baseProfile: Profile = {
    id: "profile123",
    userId: "user123",
    basics: {
      email: "",
    },
    roles: [],
    completenessScore: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe("calculate", () => {
    it("should return 0% for empty profile", () => {
      const result = ProfileCompletenessService.calculate(baseProfile);

      expect(result.score).toBe(0);
      expect(result.missingFields.length).toBeGreaterThan(0);
      expect(result.missingFields).toContain("basics.email");
      expect(result.missingFields).toContain("summary");
      expect(result.missingFields).toContain("roles");
    });

    it("should return 100% for complete profile", () => {
      const completeProfile: Profile = {
        ...baseProfile,
        basics: {
          email: "test@example.com",
          phone: "+1234567890",
          name: "John Doe",
          location: "San Francisco, CA",
          linkedIn: "https://linkedin.com/in/johndoe",
          github: "https://github.com/johndoe",
        },
        summary: "Experienced software engineer with 10 years in the field",
        roles: [
          {
            id: "role1",
            title: "Senior Engineer",
            company: "Tech Corp",
            highlights: ["Led team of 5", "Improved performance by 50%"],
          },
        ],
        skills: ["JavaScript", "TypeScript", "React"],
        education: [
          {
            id: "edu1",
            institution: "University of Tech",
            degree: "BS Computer Science",
          },
        ],
        projects: [
          {
            id: "proj1",
            name: "Project Alpha",
            description: "A cool project",
          },
        ],
        certifications: [
          {
            id: "cert1",
            name: "AWS Certified",
            issuer: "Amazon",
          },
        ],
        languages: [
          {
            language: "English",
            proficiency: "Native",
          },
        ],
      };

      const result = ProfileCompletenessService.calculate(completeProfile);

      expect(result.score).toBe(100);
      expect(result.missingFields.length).toBe(0);
    });

    it("should calculate partial completion correctly", () => {
      const partialProfile: Profile = {
        ...baseProfile,
        basics: {
          email: "test@example.com",
          phone: "+1234567890",
          name: "John Doe",
        },
        summary: "Software engineer",
        roles: [
          {
            id: "role1",
            title: "Engineer",
            highlights: [],
          },
        ],
      };

      const result = ProfileCompletenessService.calculate(partialProfile);

      // Should have email, phone, name, summary, roles = 5/13 fields
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThan(100);
      expect(result.missingFields).toContain("basics.location");
      expect(result.missingFields).toContain("skills");
    });

    it("should count github or website as complete", () => {
      const profileWithGithub: Profile = {
        ...baseProfile,
        basics: {
          email: "test@example.com",
          github: "https://github.com/johndoe",
        },
      };

      const profileWithWebsite: Profile = {
        ...baseProfile,
        basics: {
          email: "test@example.com",
          website: "https://johndoe.com",
        },
      };

      const resultGithub =
        ProfileCompletenessService.calculate(profileWithGithub);
      const resultWebsite =
        ProfileCompletenessService.calculate(profileWithWebsite);

      // Both should not have the github/website field in missing
      expect(resultGithub.missingFields).not.toContain(
        "basics.github or basics.website",
      );
      expect(resultWebsite.missingFields).not.toContain(
        "basics.github or basics.website",
      );
    });

    it("should ignore empty summary", () => {
      const profileWithEmptySummary: Profile = {
        ...baseProfile,
        summary: "   ",
      };

      const result = ProfileCompletenessService.calculate(
        profileWithEmptySummary,
      );

      expect(result.missingFields).toContain("summary");
    });
  });
});
