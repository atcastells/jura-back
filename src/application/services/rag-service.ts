import { Service, Inject } from "typedi";
import { RetrieveContextUseCase } from "./retrieve-context.use-case.js";
import { LangChainGeminiAdapter } from "../../adapters/outbound/external-services/lang-chain-gemini-adapter.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

@Service()
export class RagService {
  constructor(
    @Inject(() => RetrieveContextUseCase)
    private retrieveContext: RetrieveContextUseCase,
    @Inject(() => LangChainGeminiAdapter)
    private llm: LangChainGeminiAdapter,
  ) {}

  async answerQuery(userId: string, query: string): Promise<string> {
    // 1. Retrieve relevant context
    const chunks = await this.retrieveContext.execute(userId, query);

    // 2. Format context
    const contextText = chunks
      .map(
        (chunk) =>
          `[Source: ${chunk.metadata?.source || "Unknown"}]\n${chunk.content}`,
      )
      .join("\n\n");

    // 3. Construct prompt
    const systemPrompt = `You are a helpful assistant for Jura, a recruitment platform.
Use the following context to answer the user's question.
If the answer is not in the context, say you don't know but try to be helpful based on general knowledge if appropriate, while clarifying it's not in the documents.
Keep answers concise and professional.

Context:
${contextText}
`;

    // 4. Generate response
    const response = await this.llm.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(query),
    ]);

    // LangChain response content can be string or message array, usually string for simple chat models
    return response.content.toString();
  }
}
