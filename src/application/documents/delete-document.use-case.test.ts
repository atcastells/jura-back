import { DeleteDocumentUseCase } from "./delete-document.use-case.js";
import { SupabaseStorageAdapter } from "../../adapters/outbound/external-services/supabase/storage-service.js";
import { DocumentRepository } from "../../domain/ports/outbound/document-repository.js";
import { Document } from "../../domain/entities/document.js";

describe("DeleteDocumentUseCase", () => {
  let useCase: DeleteDocumentUseCase;
  let mockStorageAdapter: jest.Mocked<SupabaseStorageAdapter>;
  let mockDocumentRepository: jest.Mocked<DocumentRepository>;

  const mockDocument: Document = {
    id: "doc123",
    userId: "user123",
    category: "resume",
    originalName: "test.pdf",
    mimeType: "application/pdf",
    size: 1024,
    provider: "supabase",
    path: "1234567890-test.pdf",
    publicUrl: "https://example.com/storage/documents/1234567890-test.pdf",
    createdAt: new Date(),
    updatedAt: new Date(),
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

    useCase = new DeleteDocumentUseCase(
      mockDocumentRepository,
      mockStorageAdapter,
    );
  });

  describe("execute", () => {
    it("should delete a document successfully", async () => {
      const documentId = "doc123";
      const userId = "user123";

      mockDocumentRepository.findById.mockResolvedValue(mockDocument);
      mockStorageAdapter.deleteFile.mockResolvedValue();
      mockDocumentRepository.delete.mockResolvedValue();

      await useCase.execute(documentId, userId);

      expect(mockDocumentRepository.findById).toHaveBeenCalledWith(documentId);
      expect(mockStorageAdapter.deleteFile).toHaveBeenCalledWith(
        mockDocument.path,
        "documents",
      );
      expect(mockDocumentRepository.delete).toHaveBeenCalledWith(documentId);
    });

    it("should throw 404 error when document not found", async () => {
      const documentId = "nonexistent";
      const userId = "user123";

      // eslint-disable-next-line unicorn/no-useless-undefined
      mockDocumentRepository.findById.mockResolvedValue(undefined);

      await expect(useCase.execute(documentId, userId)).rejects.toMatchObject({
        status: 404,
        message: "Document not found",
      });
      expect(mockStorageAdapter.deleteFile).not.toHaveBeenCalled();
      expect(mockDocumentRepository.delete).not.toHaveBeenCalled();
    });

    it("should throw 403 error when user is not authorized to delete document", async () => {
      const documentId = "doc123";
      const unauthorizedUserId = "user456";

      mockDocumentRepository.findById.mockResolvedValue(mockDocument);

      await expect(
        useCase.execute(documentId, unauthorizedUserId),
      ).rejects.toMatchObject({
        status: 403,
        message: "Unauthorized to delete this document",
      });
      expect(mockStorageAdapter.deleteFile).not.toHaveBeenCalled();
      expect(mockDocumentRepository.delete).not.toHaveBeenCalled();
    });

    it("should throw error when storage deletion fails", async () => {
      const documentId = "doc123";
      const userId = "user123";
      const error = new Error(
        "Failed to delete file from Supabase: Storage error",
      );

      mockDocumentRepository.findById.mockResolvedValue(mockDocument);
      mockStorageAdapter.deleteFile.mockRejectedValue(error);

      await expect(useCase.execute(documentId, userId)).rejects.toThrow(
        "Failed to delete file from Supabase: Storage error",
      );
      expect(mockDocumentRepository.delete).not.toHaveBeenCalled();
    });

    it("should throw error when repository deletion fails", async () => {
      const documentId = "doc123";
      const userId = "user123";
      const error = new Error("Database error");

      mockDocumentRepository.findById.mockResolvedValue(mockDocument);
      mockStorageAdapter.deleteFile.mockResolvedValue();
      mockDocumentRepository.delete.mockRejectedValue(error);

      await expect(useCase.execute(documentId, userId)).rejects.toThrow(
        "Database error",
      );
    });
  });
});
