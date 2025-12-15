import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { Container } from "typedi";
import { RetrieveContextUseCase } from "../../../../../application/services/retrieve-context.use-case.js";

const inputSchema = z.object({
  query: z
    .string()
    .min(1)
    .describe("The natural language query to search the user's documents"),
  k: z
    .number()
    .int()
    .min(1)
    .max(10)
    .optional()
    .describe("Maximum number of chunks to retrieve"),
});

export const createRetrieveContextTool = (userId: string): DynamicStructuredTool => {
  return new DynamicStructuredTool({
    name: "retrieve_context",
    description:
      "Search the user's uploaded documents and return relevant text snippets (RAG context). Use this when you need factual details from the user's documents.",
    schema: inputSchema,
    func: async ({ query, k }) => {
      const useCase = Container.get(RetrieveContextUseCase);
      const chunks = await useCase.execute(userId, query, k ?? 5);

      return JSON.stringify(
        chunks.map((chunk) => ({
          content: chunk.content,
          metadata: chunk.metadata,
          documentId: chunk.documentId,
          chunkIndex: chunk.chunkIndex,
        })),
        undefined,
        2,
      );
    },
  });
};
