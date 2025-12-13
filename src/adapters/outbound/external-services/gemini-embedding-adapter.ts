import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Service } from "typedi";
import { EmbeddingService } from "../../../domain/ports/outbound/embedding-service.js";
import { config } from "../../../infrastructure/config.js";

@Service()
export class GeminiEmbeddingAdapter implements EmbeddingService {
  private embeddings: GoogleGenerativeAIEmbeddings;

  constructor() {
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      model: "text-embedding-004", // Or "embedding-001"
      apiKey: config.gemini.apiKey,
    });
  }

  async embedQuery(text: string): Promise<number[]> {
    return this.embeddings.embedQuery(text);
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    return this.embeddings.embedDocuments(texts);
  }
}
