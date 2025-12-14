import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { Container } from "typedi";
import { EnsureMyProfileUseCase } from "../../../../../application/profile/ensure-my-profile.use-case.js";

const inputSchema = z.object({
  userId: z.string().describe("The ID of the user whose profile to retrieve"),
});

export const createProfileGetMyProfileTool = (): DynamicStructuredTool => {
  return new DynamicStructuredTool({
    name: "profile_get_my_profile",
    description:
      "Get the user's profile. Returns the complete profile including basics, summary, roles, skills, and completeness score. Creates a new profile if one doesn't exist.",
    schema: inputSchema,
    func: async ({ userId }) => {
      const useCase = Container.get(EnsureMyProfileUseCase);
      const profile = await useCase.execute(userId);
      return JSON.stringify(profile, undefined, 2);
    },
  });
};
