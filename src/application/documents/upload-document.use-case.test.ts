import { UploadDocumentUseCase } from "./upload-document.use-case.js";
import { SupabaseStorageAdapter } from "../../adapters/outbound/external-services/supabase/storage-service.js";
import { DocumentRepository } from "../../domain/ports/outbound/document-repository.js";
import { Document, DocumentCategory } from "../../domain/entities/document.js";
import { DocumentParser } from "../../domain/ports/outbound/document-parser.js";
import { TextChunker } from "../../domain/services/text-chunker.js";
import { EmbeddingService } from "../../domain/ports/outbound/embedding-service.js";
import { VectorStore } from "../../domain/ports/outbound/vector-store.js";

describe("UploadDocumentUseCase", () => {
  let useCase: UploadDocumentUseCase;
  let mockStorageAdapter: jest.Mocked<SupabaseStorageAdapter>;
  let mockDocumentRepository: jest.Mocked<DocumentRepository>;
  let mockDocumentParser: jest.Mocked<DocumentParser>;
  let mockTextChunker: jest.Mocked<TextChunker>;
  let mockEmbeddingService: jest.Mocked<EmbeddingService>;
  let mockVectorStore: jest.Mocked<VectorStore>;

  const mockFile = {
    buffer: Buffer.from("test"),
    mimetype: "application/pdf",
    originalname: "test.pdf",
    size: 1024,
  };

  beforeEach(() => {
    mockStorageAdapter = {
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
    } as unknown as jest.Mocked<SupabaseStorageAdapter>;

    mockDocumentRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<DocumentRepository>;

    mockDocumentParser = {
      parse: jest.fn(),
    };

    mockTextChunker = {
      split: jest.fn(),
    } as unknown as jest.Mocked<TextChunker>; // Class mock needs casting or full mock

    mockEmbeddingService = {
      embedDocuments: jest.fn(),
      embedQuery: jest.fn(),
    };

    mockVectorStore = {
      addDocuments: jest.fn(),
      similaritySearch: jest.fn(),
    };

    useCase = new UploadDocumentUseCase(
      mockStorageAdapter,
      mockDocumentRepository,
      mockDocumentParser,
      mockTextChunker,
      mockEmbeddingService,
      mockVectorStore,
    );
  });

  describe("execute", () => {
    it("should upload a document successfully", async () => {
      const userId = "user123";
      const category: DocumentCategory = "resume";
      const mockUploadResult = {
        path: "1234567890-test.pdf",
        publicUrl: "https://example.com/storage/documents/1234567890-test.pdf",
      };
      const mockSavedDocument: Document = {
        id: "doc123",
        userId,
        category,
        originalName: mockFile.originalname,
        mimeType: mockFile.mimetype,
        size: mockFile.size,
        provider: "supabase",
        path: mockUploadResult.path,
        publicUrl: mockUploadResult.publicUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockStorageAdapter.uploadFile.mockResolvedValue(mockUploadResult);
      mockDocumentRepository.save.mockResolvedValue(mockSavedDocument);

      const result = await useCase.execute(userId, mockFile, category);

      expect(mockStorageAdapter.uploadFile).toHaveBeenCalledWith(
        mockFile,
        "documents",
      );
      expect(mockDocumentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          category,
          originalName: mockFile.originalname,
          mimeType: mockFile.mimetype,
          size: mockFile.size,
          provider: "supabase",
          path: mockUploadResult.path,
          publicUrl: mockUploadResult.publicUrl,
        }),
      );
      expect(result).toEqual(mockSavedDocument);
    });

    it("should throw error when storage upload fails", async () => {
      const userId = "user123";
      const category: DocumentCategory = "resume";
      const error = new Error(
        "Failed to upload file to Supabase: Storage error",
      );

      mockStorageAdapter.uploadFile.mockRejectedValue(error);

      await expect(useCase.execute(userId, mockFile, category)).rejects.toThrow(
        "Failed to upload file to Supabase: Storage error",
      );
      expect(mockDocumentRepository.save).not.toHaveBeenCalled();
    });

    it("should throw error when repository save fails", async () => {
      const userId = "user123";
      const category: DocumentCategory = "resume";
      const mockUploadResult = {
        path: "1234567890-test.pdf",
        publicUrl: "https://example.com/storage/documents/1234567890-test.pdf",
      };
      const error = new Error("Database error");

      mockStorageAdapter.uploadFile.mockResolvedValue(mockUploadResult);
      mockDocumentRepository.save.mockRejectedValue(error);

      await expect(useCase.execute(userId, mockFile, category)).rejects.toThrow(
        "Database error",
      );
    });

    it("should handle different file categories", async () => {
      const userId = "user123";
      const categories: DocumentCategory[] = [
        "resume",
        "cover_letter",
        "portfolio",
        "certification",
        "transcript",
        "reference",
        "other",
      ];

      for (const category of categories) {
        const mockUploadResult = {
          path: `1234567890-test-${category}.pdf`,
          publicUrl: `https://example.com/storage/documents/1234567890-test-${category}.pdf`,
        };
        const mockSavedDocument: Document = {
          id: `doc-${category}`,
          userId,
          category,
          originalName: mockFile.originalname,
          mimeType: mockFile.mimetype,
          size: mockFile.size,
          provider: "supabase",
          path: mockUploadResult.path,
          publicUrl: mockUploadResult.publicUrl,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockStorageAdapter.uploadFile.mockResolvedValue(mockUploadResult);
        mockDocumentRepository.save.mockResolvedValue(mockSavedDocument);

        const result = await useCase.execute(userId, mockFile, category);

        expect(result.category).toBe(category);
      }
    });
  });
});
