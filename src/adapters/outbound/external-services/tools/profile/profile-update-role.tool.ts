import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { Container } from "typedi";
import { UpdateRoleUseCase } from "../../../../../application/profile/update-role.use-case.js";

const inputSchema = z.object({
  userId: z.string().describe("The ID of the user whose profile to update"),
  roleId: z.string().describe("The ID of the role to update"),
  title: z.string().optional().describe("Job title or role name"),
  company: z.string().optional().describe("Company name"),
  location: z.string().optional().describe("Location of the role"),
  startDate: z.string().optional().describe("Start date (ISO format or text)"),
  endDate: z.string().optional().describe("End date (ISO format or text)"),
  current: z.boolean().optional().describe("Whether this is a current role"),
  description: z.string().optional().describe("Description of the role"),
  highlights: z
    .array(z.string())
    .optional()
    .describe("Key achievements or highlights in this role"),
});

export const createProfileUpdateRoleTool = (): DynamicStructuredTool => {
  return new DynamicStructuredTool({
    name: "profile_update_role",
    description:
      "Update an existing work role/experience in the user's profile. Only provided fields will be updated.",
    schema: inputSchema,
    func: async ({ userId, roleId, ...updates }) => {
      const useCase = Container.get(UpdateRoleUseCase);
      const profile = await useCase.execute(userId, roleId, updates);
      return JSON.stringify(profile, undefined, 2);
    },
  });
};
