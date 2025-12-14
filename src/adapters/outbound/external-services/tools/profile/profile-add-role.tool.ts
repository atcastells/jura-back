import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { Container } from "typedi";
import { AddRoleUseCase } from "../../../../../application/profile/add-role.use-case.js";

const inputSchema = z.object({
  userId: z.string().describe("The ID of the user whose profile to update"),
  title: z.string().describe("Job title or role name"),
  company: z.string().optional().describe("Company name"),
  location: z.string().optional().describe("Location of the role"),
  startDate: z.string().optional().describe("Start date (ISO format or text)"),
  endDate: z.string().optional().describe("End date (ISO format or text)"),
  current: z.boolean().optional().describe("Whether this is a current role"),
  description: z.string().optional().describe("Description of the role"),
  highlights: z
    .array(z.string())
    .describe("Key achievements or highlights in this role"),
});

export const createProfileAddRoleTool = (): DynamicStructuredTool => {
  return new DynamicStructuredTool({
    name: "profile_add_role",
    description:
      "Add a new work role/experience to the user's profile. Include title, company, dates, description, and key highlights.",
    schema: inputSchema,
    func: async ({ userId, ...roleData }) => {
      const useCase = Container.get(AddRoleUseCase);
      const profile = await useCase.execute(userId, roleData);
      return JSON.stringify(profile, undefined, 2);
    },
  });
};
