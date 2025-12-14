import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { Container } from "typedi";
import { UpdateMyProfileUseCase } from "../../../../../application/profile/update-my-profile.use-case.js";

const inputSchema = z.object({
  userId: z.string().describe("The ID of the user whose profile to update"),
  basics: z
    .object({
      email: z.string().email().optional(),
      phone: z.string().optional(),
      name: z.string().optional(),
      location: z.string().optional(),
      linkedIn: z.string().optional(),
      github: z.string().optional(),
      website: z.string().optional(),
    })
    .describe("Basic profile information to update"),
});

export const createProfileUpdateBasicsTool = (): DynamicStructuredTool => {
  return new DynamicStructuredTool({
    name: "profile_update_basics",
    description:
      "Update basic profile information like email, phone, name, location, and social links. Only provided fields will be updated.",
    schema: inputSchema,
    func: async ({ userId, basics }) => {
      const useCase = Container.get(UpdateMyProfileUseCase);
      const profile = await useCase.execute(userId, { basics });
      return JSON.stringify(profile, undefined, 2);
    },
  });
};
