export interface DocumentChunk {
  id: string;
  documentId: string;
  userId: string;
  content: string;
  embedding?: number[];
  metadata: Record<string, unknown>;
  chunkIndex: number;
}
