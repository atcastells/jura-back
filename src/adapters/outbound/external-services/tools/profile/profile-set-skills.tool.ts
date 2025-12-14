import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { Container } from "typedi";
import { UpdateMyProfileUseCase } from "../../../../../application/profile/update-my-profile.use-case.js";

const inputSchema = z.object({
  userId: z.string().describe("The ID of the user whose profile to update"),
  skills: z
    .array(z.string())
    .describe("Array of skills to set for the user's profile"),
});

export const createProfileSetSkillsTool = (): DynamicStructuredTool => {
  return new DynamicStructuredTool({
    name: "profile_set_skills",
    description:
      "Set or replace the complete skills list for the user's profile. Pass all skills, not just new ones.",
    schema: inputSchema,
    func: async ({ userId, skills }) => {
      const useCase = Container.get(UpdateMyProfileUseCase);
      const profile = await useCase.execute(userId, { skills });
      return JSON.stringify(profile, undefined, 2);
    },
  });
};
