import { Service, Inject } from "typedi";
import { SupabaseClient } from "../../authentication/supabase-client.js";
import { DocumentChunk } from "../../../../domain/entities/document-chunk.js";
import { VectorStore } from "../../../../domain/ports/outbound/vector-store.js";

@Service()
export class SupabaseVectorStore implements VectorStore {
  constructor(
    @Inject(() => SupabaseClient) private supabaseClient: SupabaseClient,
  ) {}

  async addDocuments(documents: DocumentChunk[]): Promise<void> {
    const rows = documents.map((document) => ({
      document_id: document.documentId,
      user_id: document.userId,
      content: document.content,
      embedding: document.embedding,
      metadata: document.metadata,
      chunk_index: document.chunkIndex,
    }));

    const { error } = await this.supabaseClient
      .getClient()
      .from("document_chunks")
      .insert(rows);

    if (error) {
      throw new Error(`Failed to insert document chunks: ${error.message}`);
    }
  }

  async similaritySearch(
    embedding: number[],
    k: number,
    filter: { userId: string },
  ): Promise<DocumentChunk[]> {
    const { data, error } = await this.supabaseClient
      .getClient()
      .rpc("match_documents", {
        query_embedding: embedding,
        match_threshold: 0.5, // TODO: Make configurable
        match_count: k,
        filter_user_id: filter.userId,
      });

    if (error) {
      throw new Error(`Vector search failed: ${error.message}`);
    }

    if (!data) return [];

    // Map back to DocumentChunk
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((row: any) => ({
      id: row.id,
      documentId: row.document_id,
      userId: row.user_id,
      content: row.content,
      // embedding: row.embedding, // We usually don't need the vector back
      metadata: row.metadata,
      chunkIndex: row.chunk_index,
    }));
  }
}
