/* eslint-disable @typescript-eslint/no-explicit-any */
import { SupabaseStorageAdapter } from "./storage-service.js";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

jest.mock("@supabase/supabase-js");
jest.mock("../../../../infrastructure/config.js", () => ({
  config: {
    supabase: {
      url: "https://test.supabase.co",
      anonKey: "test-anon-key",
    },
  },
}));

describe("SupabaseStorageAdapter", () => {
  let adapter: SupabaseStorageAdapter;
  let mockSupabaseClient: jest.Mocked<SupabaseClient>;
  let mockStorage: any;

  const mockFile = {
    buffer: Buffer.from("test content"),
    mimetype: "application/pdf",
    originalname: "test.pdf",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockStorage = {
      from: jest.fn().mockReturnThis(),
      upload: jest.fn(),
      getPublicUrl: jest.fn(),
      remove: jest.fn(),
    };

    mockSupabaseClient = {
      storage: mockStorage,
    } as unknown as jest.Mocked<SupabaseClient>;

    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);

    adapter = new SupabaseStorageAdapter();
  });

  describe("uploadFile", () => {
    it("should upload a file successfully and return path and public URL", async () => {
      const bucketName = "documents";
      const mockPublicUrl =
        "https://test.supabase.co/storage/v1/object/public/documents/1234567890-test.pdf";

      mockStorage.upload.mockResolvedValue({ data: {}, error: undefined });
      mockStorage.getPublicUrl.mockReturnValue({
        data: { publicUrl: mockPublicUrl },
      });

      const result = await adapter.uploadFile(mockFile, bucketName);

      expect(mockStorage.from).toHaveBeenCalledWith(bucketName);
      expect(mockStorage.upload).toHaveBeenCalledWith(
        expect.stringMatching(/-test\.pdf$/),
        mockFile.buffer,
        {
          contentType: mockFile.mimetype,
          upsert: false,
        },
      );
      expect(mockStorage.getPublicUrl).toHaveBeenCalledWith(
        expect.stringMatching(/-test\.pdf$/),
      );
      expect(result).toEqual({
        path: expect.stringMatching(/-test\.pdf$/),
        publicUrl: mockPublicUrl,
      });
      expect(result.path).toMatch(/^\d+-test\.pdf$/);
    });

    it("should throw error when upload fails", async () => {
      const bucketName = "documents";
      const uploadError = { message: "Storage quota exceeded" };

      mockStorage.upload.mockResolvedValue({
        data: undefined,
        error: uploadError,
      });

      await expect(adapter.uploadFile(mockFile, bucketName)).rejects.toThrow(
        "Failed to upload file to Supabase: Storage quota exceeded",
      );
    });

    it("should generate unique filenames with timestamp", async () => {
      const bucketName = "documents";
      const mockPublicUrl =
        "https://test.supabase.co/storage/v1/object/public/documents/test.pdf";

      mockStorage.upload.mockResolvedValue({ data: {}, error: undefined });
      mockStorage.getPublicUrl.mockReturnValue({
        data: { publicUrl: mockPublicUrl },
      });

      const dateSpy = jest.spyOn(Date, "now");
      dateSpy.mockReturnValue(1_234_567_890);

      const result = await adapter.uploadFile(mockFile, bucketName);

      expect(result.path).toBe("1234567890-test.pdf");

      dateSpy.mockRestore();
    });

    it("should handle different file types", async () => {
      const bucketName = "documents";
      const mockPublicUrl =
        "https://test.supabase.co/storage/v1/object/public/documents/test.jpg";
      const imageFile = {
        buffer: Buffer.from("image content"),
        mimetype: "image/jpeg",
        originalname: "test.jpg",
      };

      mockStorage.upload.mockResolvedValue({ data: {}, error: undefined });
      mockStorage.getPublicUrl.mockReturnValue({
        data: { publicUrl: mockPublicUrl },
      });

      const result = await adapter.uploadFile(imageFile, bucketName);

      expect(mockStorage.upload).toHaveBeenCalledWith(
        expect.stringMatching(/-test\.jpg$/),
        imageFile.buffer,
        {
          contentType: "image/jpeg",
          upsert: false,
        },
      );
      expect(result.path).toMatch(/^\d+-test\.jpg$/);
    });
  });

  describe("deleteFile", () => {
    it("should delete a file successfully", async () => {
      const bucketName = "documents";
      const filePath = "1234567890-test.pdf";

      mockStorage.remove.mockResolvedValue({ data: {}, error: undefined });

      await adapter.deleteFile(filePath, bucketName);

      expect(mockStorage.from).toHaveBeenCalledWith(bucketName);
      expect(mockStorage.remove).toHaveBeenCalledWith([filePath]);
    });

    it("should throw error when deletion fails", async () => {
      const bucketName = "documents";
      const filePath = "1234567890-test.pdf";
      const deleteError = { message: "File not found" };

      mockStorage.remove.mockResolvedValue({
        data: undefined,
        error: deleteError,
      });

      await expect(adapter.deleteFile(filePath, bucketName)).rejects.toThrow(
        "Failed to delete file from Supabase: File not found",
      );
    });

    it("should handle deletion of multiple files by path", async () => {
      const bucketName = "documents";
      const filePath1 = "1234567890-test1.pdf";
      const filePath2 = "1234567891-test2.pdf";

      mockStorage.remove.mockResolvedValue({ data: {}, error: undefined });

      await adapter.deleteFile(filePath1, bucketName);
      await adapter.deleteFile(filePath2, bucketName);

      expect(mockStorage.remove).toHaveBeenCalledTimes(2);
      expect(mockStorage.remove).toHaveBeenNthCalledWith(1, [filePath1]);
      expect(mockStorage.remove).toHaveBeenNthCalledWith(2, [filePath2]);
    });
  });
});
