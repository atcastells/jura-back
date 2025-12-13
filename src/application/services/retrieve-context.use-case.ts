import { Service, Inject } from "typedi";
import { VectorStore } from "../../domain/ports/outbound/vector-store.js";
import { EmbeddingService } from "../../domain/ports/outbound/embedding-service.js";
import { GeminiEmbeddingAdapter } from "../../adapters/outbound/external-services/gemini-embedding-adapter.js";
import { SupabaseVectorStore } from "../../adapters/outbound/persistence/supabase/supabase-vector-store.js";
import { DocumentChunk } from "../../domain/entities/document-chunk.js";

@Service()
export class RetrieveContextUseCase {
  constructor(
    @Inject(() => GeminiEmbeddingAdapter)
    private embeddingService: EmbeddingService,
    @Inject(() => SupabaseVectorStore) private vectorStore: VectorStore,
  ) {}

  async execute(
    userId: string,
    query: string,
    k = 5,
  ): Promise<DocumentChunk[]> {
    if (!query) return [];

    // 1. Generate embedding for the query
    const embedding = await this.embeddingService.embedQuery(query);

    // 2. Search vector store with user filter
    const chunks = await this.vectorStore.similaritySearch(embedding, k, {
      userId,
    });

    return chunks;
  }
}
