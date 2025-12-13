/* eslint-disable @typescript-eslint/no-explicit-any */
import { MongoDocumentRepository } from "./mongo-document-repository.js";
import { MongoDBAdapter } from "./mongo-database-adapter.js";
import { Document } from "../../../../domain/entities/document.js";
import { ObjectId, Collection } from "mongodb";

describe("MongoDocumentRepository", () => {
  let repository: MongoDocumentRepository;
  let mockDatabaseConnection: jest.Mocked<MongoDBAdapter>;
  let mockCollection: jest.Mocked<Collection>;

  const mockDocument: Omit<Document, "id"> = {
    userId: "user123",
    category: "resume",
    originalName: "test.pdf",
    mimeType: "application/pdf",
    size: 1024,
    provider: "supabase" as const,
    path: "1234567890-test.pdf",
    publicUrl: "https://example.com/storage/documents/1234567890-test.pdf",
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2023-01-01"),
  };

  beforeEach(() => {
    mockCollection = {
      insertOne: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      deleteOne: jest.fn(),
    } as unknown as jest.Mocked<Collection>;

    mockDatabaseConnection = {
      getDb: jest.fn().mockReturnValue({
        collection: jest.fn().mockReturnValue(mockCollection),
      }),
      connect: jest.fn(),
      disconnect: jest.fn(),
    } as unknown as jest.Mocked<MongoDBAdapter>;

    repository = new MongoDocumentRepository(mockDatabaseConnection);
  });

  describe("save", () => {
    it("should save a document and return it with generated id", async () => {
      const documentWithId = { id: "doc123", ...mockDocument };
      const insertedId = new ObjectId();

      mockCollection.insertOne.mockResolvedValue({
        insertedId,
        acknowledged: true,
      } as any);

      const result = await repository.save(documentWithId);

      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockDocument.userId,
          category: mockDocument.category,
          originalName: mockDocument.originalName,
        }),
      );
      expect(result).toMatchObject(mockDocument);
      expect(result.id).toBe(insertedId.toString());
    });

    it("should validate document data with Zod schema", async () => {
      const invalidDocument = {
        id: "doc123",
        userId: "user123",
        category: "invalid_category" as any,
        originalName: "test.pdf",
        mimeType: "application/pdf",
        size: 1024,
        provider: "supabase" as const,
        path: "test.pdf",
        publicUrl: "https://example.com/test.pdf",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await expect(repository.save(invalidDocument)).rejects.toThrow();
    });

    it("should handle all valid document categories", async () => {
      const categories = [
        "resume",
        "cover_letter",
        "portfolio",
        "certification",
        "transcript",
        "reference",
        "other",
      ] as const;

      for (const category of categories) {
        const insertedId = new ObjectId();
        const document = { id: `doc-${category}`, ...mockDocument, category };

        mockCollection.insertOne.mockResolvedValue({
          insertedId,
          acknowledged: true,
        } as any);

        const result = await repository.save(document);
        expect(result.category).toBe(category);
      }
    });
  });

  describe("findById", () => {
    it("should find a document by id", async () => {
      const objectId = new ObjectId();
      const mongoDocument = {
        _id: objectId,
        ...mockDocument,
      };

      mockCollection.findOne.mockResolvedValue(mongoDocument as any);

      const result = await repository.findById(objectId.toString());

      expect(mockCollection.findOne).toHaveBeenCalledWith({
        _id: objectId,
      });
      expect(result).toMatchObject(mockDocument);
      expect(result?.id).toBe(objectId.toString());
    });

    it("should return undefined for invalid ObjectId", async () => {
      const result = await repository.findById("invalid-id");

      expect(mockCollection.findOne).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it("should return undefined when document not found", async () => {
      const objectId = new ObjectId();

      // eslint-disable-next-line unicorn/no-useless-undefined
      mockCollection.findOne.mockResolvedValue(undefined);

      const result = await repository.findById(objectId.toString());

      expect(result).toBeUndefined();
    });
  });

  describe("findByUserId", () => {
    it("should find all documents for a user", async () => {
      const userId = "user123";
      const objectId1 = new ObjectId();
      const objectId2 = new ObjectId();
      const mongoDocuments = [
        {
          _id: objectId1,
          ...mockDocument,
          userId,
        },
        {
          _id: objectId2,
          ...mockDocument,
          userId,
          category: "cover_letter" as const,
        },
      ];

      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mongoDocuments),
      } as any);

      const result = await repository.findByUserId(userId);

      expect(mockCollection.find).toHaveBeenCalledWith({ userId });
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(objectId1.toString());
      expect(result[1].id).toBe(objectId2.toString());
    });

    it("should return empty array when no documents found", async () => {
      const userId = "user456";

      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
      } as any);

      const result = await repository.findByUserId(userId);

      expect(result).toEqual([]);
    });
  });

  describe("delete", () => {
    it("should delete a document by id", async () => {
      const objectId = new ObjectId();

      mockCollection.deleteOne.mockResolvedValue({
        deletedCount: 1,
        acknowledged: true,
      } as any);

      await repository.delete(objectId.toString());

      expect(mockCollection.deleteOne).toHaveBeenCalledWith({
        _id: objectId,
      });
    });

    it("should not call deleteOne for invalid ObjectId", async () => {
      await repository.delete("invalid-id");

      expect(mockCollection.deleteOne).not.toHaveBeenCalled();
    });

    it("should handle deletion of non-existent document", async () => {
      const objectId = new ObjectId();

      mockCollection.deleteOne.mockResolvedValue({
        deletedCount: 0,
        acknowledged: true,
      } as any);

      await repository.delete(objectId.toString());

      expect(mockCollection.deleteOne).toHaveBeenCalledWith({
        _id: objectId,
      });
    });
  });
});
