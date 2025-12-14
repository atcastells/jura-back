import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { Container } from "typedi";
import { DeleteRoleUseCase } from "../../../../../application/profile/delete-role.use-case.js";

const inputSchema = z.object({
  userId: z.string().describe("The ID of the user whose profile to update"),
  roleId: z.string().describe("The ID of the role to delete"),
});

export const createProfileDeleteRoleTool = (): DynamicStructuredTool => {
  return new DynamicStructuredTool({
    name: "profile_delete_role",
    description: "Delete a work role/experience from the user's profile.",
    schema: inputSchema,
    func: async ({ userId, roleId }) => {
      const useCase = Container.get(DeleteRoleUseCase);
      const profile = await useCase.execute(userId, roleId);
      return JSON.stringify(profile, undefined, 2);
    },
  });
};
