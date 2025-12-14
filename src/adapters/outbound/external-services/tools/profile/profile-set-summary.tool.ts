import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { Container } from "typedi";
import { UpdateMyProfileUseCase } from "../../../../../application/profile/update-my-profile.use-case.js";

const inputSchema = z.object({
  userId: z.string().describe("The ID of the user whose profile to update"),
  summary: z
    .string()
    .describe("Professional summary or bio for the user's profile"),
});

export const createProfileSetSummaryTool = (): DynamicStructuredTool => {
  return new DynamicStructuredTool({
    name: "profile_set_summary",
    description:
      "Set or update the professional summary/bio for the user's profile. This is a high-level description of their experience and expertise.",
    schema: inputSchema,
    func: async ({ userId, summary }) => {
      const useCase = Container.get(UpdateMyProfileUseCase);
      const profile = await useCase.execute(userId, { summary });
      return JSON.stringify(profile, undefined, 2);
    },
  });
};
