import { ListDocumentsUseCase } from "./list-documents.use-case.js";
import { DocumentRepository } from "../../domain/ports/outbound/document-repository.js";
import { Document } from "../../domain/entities/document.js";

describe("ListDocumentsUseCase", () => {
  let useCase: ListDocumentsUseCase;
  let mockDocumentRepository: jest.Mocked<DocumentRepository>;

  const mockDocuments: Document[] = [
    {
      id: "doc1",
      userId: "user123",
      category: "resume",
      originalName: "resume.pdf",
      mimeType: "application/pdf",
      size: 1024,
      provider: "supabase",
      path: "1234567890-resume.pdf",
      publicUrl: "https://example.com/storage/documents/1234567890-resume.pdf",
      createdAt: new Date("2023-01-01"),
      updatedAt: new Date("2023-01-01"),
    },
    {
      id: "doc2",
      userId: "user123",
      category: "cover_letter",
      originalName: "cover.pdf",
      mimeType: "application/pdf",
      size: 2048,
      provider: "supabase",
      path: "1234567891-cover.pdf",
      publicUrl: "https://example.com/storage/documents/1234567891-cover.pdf",
      createdAt: new Date("2023-01-02"),
      updatedAt: new Date("2023-01-02"),
    },
  ];

  beforeEach(() => {
    mockDocumentRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<DocumentRepository>;

    useCase = new ListDocumentsUseCase(mockDocumentRepository);
  });

  describe("execute", () => {
    it("should return all documents for a user", async () => {
      const userId = "user123";

      mockDocumentRepository.findByUserId.mockResolvedValue(mockDocuments);

      const result = await useCase.execute(userId);

      expect(mockDocumentRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockDocuments);
      expect(result).toHaveLength(2);
    });

    it("should return empty array when user has no documents", async () => {
      const userId = "user456";

      mockDocumentRepository.findByUserId.mockResolvedValue([]);

      const result = await useCase.execute(userId);

      expect(mockDocumentRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it("should throw error when repository fails", async () => {
      const userId = "user123";
      const error = new Error("Database error");

      mockDocumentRepository.findByUserId.mockRejectedValue(error);

      await expect(useCase.execute(userId)).rejects.toThrow("Database error");
    });
  });
});
