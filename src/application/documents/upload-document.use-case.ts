import { Service, Inject } from "typedi";
import { Document } from "../../domain/entities/document.js";
import { DocumentRepository } from "../../domain/ports/outbound/document-repository.js";
import { SupabaseStorageAdapter } from "../../adapters/outbound/external-services/supabase/storage-service.js";
import { DOCUMENT_REPOSITORY } from "../../infrastructure/constants.js";
import { DOCUMENT_BUCKET_NAME } from "../../adapters/outbound/external-services/supabase/constants.js";
import { DocumentParser } from "../../domain/ports/outbound/document-parser.js";
import { PdfParserAdapter } from "../../adapters/outbound/document-parsing/pdf-parser-adapter.js";
import { TextChunker } from "../../domain/services/text-chunker.js";
import { EmbeddingService } from "../../domain/ports/outbound/embedding-service.js";
import { GeminiEmbeddingAdapter } from "../../adapters/outbound/external-services/gemini-embedding-adapter.js";
import { VectorStore } from "../../domain/ports/outbound/vector-store.js";
import { SupabaseVectorStore } from "../../adapters/outbound/persistence/supabase/supabase-vector-store.js";
import { DocumentChunk } from "../../domain/entities/document-chunk.js";
import { randomUUID } from "node:crypto";

interface MulterFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

@Service()
export class UploadDocumentUseCase {
  constructor(
    @Inject(() => SupabaseStorageAdapter)
    private readonly storageAdapter: SupabaseStorageAdapter,
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: DocumentRepository,
    @Inject(() => PdfParserAdapter)
    private readonly documentParser: DocumentParser,
    @Inject(() => TextChunker)
    private readonly textChunker: TextChunker,
    @Inject(() => GeminiEmbeddingAdapter)
    private readonly embeddingService: EmbeddingService,
    @Inject(() => SupabaseVectorStore)
    private readonly vectorStore: VectorStore,
  ) {}

  async execute(
    userId: string,
    file: MulterFile,
    category: Document["category"],
  ): Promise<Document> {
    // 1. Upload to Supabase Storage
    const { path, publicUrl } = await this.storageAdapter.uploadFile(
      file,
      DOCUMENT_BUCKET_NAME,
    );

    // 2. Create Document Entity and Save to DB
    // We provide a placeholder ID as the repository handles ID generation for new documents
    const documentData: Document = {
      id: "",
      userId,
      category,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      provider: "supabase",
      path,
      publicUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const savedDocument = await this.documentRepository.save(documentData);
    const documentId = savedDocument.id;

    // 3. Process Document (Parse -> Chunk -> Embed -> Vector Store)
    // We only process if it's a PDF for now, or extend parser for others.
    if (file.mimetype === "application/pdf") {
      try {
        const text = await this.documentParser.parse(
          file.buffer,
          file.mimetype,
        );
        const textChunks = this.textChunker.split(text);

        if (textChunks.length > 0) {
          const embeddings =
            await this.embeddingService.embedDocuments(textChunks);

          const chunks: DocumentChunk[] = textChunks.map((chunk, index) => ({
            id: randomUUID(),
            documentId,
            userId,
            content: chunk,
            embedding: embeddings[index],
            chunkIndex: index,
            metadata: {
              source: file.originalname,
              page: 0, // PDF parser might not give page numbers easily with simple pdf-parse
            },
          }));

          await this.vectorStore.addDocuments(chunks);
          console.log(
            `Processed ${chunks.length} chunks for document ${documentId}`,
          );
        }
      } catch (error) {
        console.error(`Failed to process document ${documentId}:`, error);
        // We might want to mark the document as "processed_with_errors" or similar in future
      }
    }

    return savedDocument;
  }
}
