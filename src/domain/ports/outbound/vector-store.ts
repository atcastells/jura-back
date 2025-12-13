import { DocumentChunk } from "../../entities/document-chunk.js";

export interface VectorStore {
  addDocuments(documents: DocumentChunk[]): Promise<void>;
  similaritySearch(
    embedding: number[],
    k: number,
    filter: { userId: string },
  ): Promise<DocumentChunk[]>;
}
