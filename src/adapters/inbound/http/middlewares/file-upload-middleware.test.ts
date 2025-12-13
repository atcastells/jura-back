/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable unicorn/consistent-function-scoping */
import { Request, Response } from "express";
import {
  createFileUploadMiddleware,
  pdfUploadMiddleware,
  imageUploadMiddleware,
} from "./file-upload-middleware.js";

// Mock multer
jest.mock("multer", () => {
  const multer: any = jest.fn(() => ({
    single: jest.fn((_fieldName: string) => {
      return (request: any, _response: any, next: any) => {
        const file = request.testFile;
        if (!file) {
          return next(new Error("No file provided"));
        }

        // Check file type
        const config = request.testConfig;
        if (
          config?.allowedMimeTypes &&
          !config.allowedMimeTypes.includes(file.mimetype)
        ) {
          return next(
            new Error(
              `Invalid file type. Allowed: ${config.allowedMimeTypes.join(", ")}`,
            ),
          );
        }

        // Check file size
        if (config?.maxSizeInBytes && file.size > config.maxSizeInBytes) {
          return next(new Error("File too large"));
        }

        request.file = file;
        next();
      };
    }),
  }));
  multer.memoryStorage = jest.fn(() => ({}));
  return multer;
});

interface TestRequest extends Request {
  testFile?: any;
  testConfig?: any;
}

describe("File Upload Middleware", () => {
  let mockRequest: Partial<TestRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      testFile: undefined,
      testConfig: undefined,
      file: undefined,
    };
    mockResponse = {};
    nextFunction = jest.fn();
  });

  describe("createFileUploadMiddleware", () => {
    it("should create middleware with custom config", () => {
      const config = {
        allowedMimeTypes: ["application/pdf"],
        maxSizeInBytes: 10 * 1024 * 1024,
      };

      const middleware = createFileUploadMiddleware(config);

      expect(middleware).toBeInstanceOf(Function);
    });

    it("should accept valid file with allowed MIME type", () => {
      const config = {
        allowedMimeTypes: ["application/pdf"],
        maxSizeInBytes: 10 * 1024 * 1024,
      };

      mockRequest.testFile = {
        buffer: Buffer.from("test"),
        mimetype: "application/pdf",
        originalname: "test.pdf",
        size: 1024,
      };
      mockRequest.testConfig = config;

      const middleware = createFileUploadMiddleware(config);
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(nextFunction).toHaveBeenCalledWith();
      expect(mockRequest.file).toBeDefined();
    });

    it("should reject file with invalid MIME type", () => {
      const config = {
        allowedMimeTypes: ["application/pdf"],
        maxSizeInBytes: 10 * 1024 * 1024,
      };

      mockRequest.testFile = {
        buffer: Buffer.from("test"),
        mimetype: "image/jpeg",
        originalname: "test.jpg",
        size: 1024,
      };
      mockRequest.testConfig = config;

      const middleware = createFileUploadMiddleware(config);
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Invalid file type"),
        }),
      );
    });

    it("should reject file exceeding size limit", () => {
      const config = {
        allowedMimeTypes: ["application/pdf"],
        maxSizeInBytes: 1024, // 1KB
      };

      mockRequest.testFile = {
        buffer: Buffer.from("test"),
        mimetype: "application/pdf",
        originalname: "test.pdf",
        size: 2048, // 2KB
      };
      mockRequest.testConfig = config;

      const middleware = createFileUploadMiddleware(config);
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "File too large",
        }),
      );
    });

    it("should use custom field name", () => {
      const config = {
        allowedMimeTypes: ["application/pdf"],
        maxSizeInBytes: 10 * 1024 * 1024,
        fieldName: "document",
      };

      const middleware = createFileUploadMiddleware(config);

      expect(middleware).toBeInstanceOf(Function);
    });

    it("should handle missing file", () => {
      const config = {
        allowedMimeTypes: ["application/pdf"],
        maxSizeInBytes: 10 * 1024 * 1024,
      };

      mockRequest.testFile = undefined;
      mockRequest.testConfig = config;

      const middleware = createFileUploadMiddleware(config);
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "No file provided",
        }),
      );
    });
  });

  describe("pdfUploadMiddleware", () => {
    it("should accept PDF files", () => {
      mockRequest.testFile = {
        buffer: Buffer.from("test"),
        mimetype: "application/pdf",
        originalname: "test.pdf",
        size: 1024,
      };
      mockRequest.testConfig = {
        allowedMimeTypes: ["application/pdf"],
        maxSizeInBytes: 10 * 1024 * 1024,
      };

      pdfUploadMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(nextFunction).toHaveBeenCalledWith();
    });

    it("should reject non-PDF files", () => {
      mockRequest.testFile = {
        buffer: Buffer.from("test"),
        mimetype: "image/jpeg",
        originalname: "test.jpg",
        size: 1024,
      };
      mockRequest.testConfig = {
        allowedMimeTypes: ["application/pdf"],
        maxSizeInBytes: 10 * 1024 * 1024,
      };

      pdfUploadMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Invalid file type"),
        }),
      );
    });

    it("should reject PDF files exceeding 10MB", () => {
      mockRequest.testFile = {
        buffer: Buffer.from("test"),
        mimetype: "application/pdf",
        originalname: "test.pdf",
        size: 11 * 1024 * 1024, // 11MB
      };
      mockRequest.testConfig = {
        allowedMimeTypes: ["application/pdf"],
        maxSizeInBytes: 10 * 1024 * 1024,
      };

      pdfUploadMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "File too large",
        }),
      );
    });
  });

  describe("imageUploadMiddleware", () => {
    it("should accept image files", () => {
      const imageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

      for (const mimetype of imageTypes) {
        mockRequest.testFile = {
          buffer: Buffer.from("test"),
          mimetype,
          originalname: `test.${mimetype.split("/")[1]}`,
          size: 1024,
        };
        mockRequest.testConfig = {
          allowedMimeTypes: imageTypes,
          maxSizeInBytes: 5 * 1024 * 1024,
        };

        const localNextFunction = jest.fn();

        imageUploadMiddleware(
          mockRequest as Request,
          mockResponse as Response,
          localNextFunction,
        );

        expect(localNextFunction).toHaveBeenCalledWith();
      }
    });

    it("should reject non-image files", () => {
      mockRequest.testFile = {
        buffer: Buffer.from("test"),
        mimetype: "application/pdf",
        originalname: "test.pdf",
        size: 1024,
      };
      mockRequest.testConfig = {
        allowedMimeTypes: [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
        ],
        maxSizeInBytes: 5 * 1024 * 1024,
      };

      imageUploadMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Invalid file type"),
        }),
      );
    });

    it("should reject image files exceeding 5MB", () => {
      mockRequest.testFile = {
        buffer: Buffer.from("test"),
        mimetype: "image/jpeg",
        originalname: "test.jpg",
        size: 6 * 1024 * 1024, // 6MB
      };
      mockRequest.testConfig = {
        allowedMimeTypes: [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
        ],
        maxSizeInBytes: 5 * 1024 * 1024,
      };

      imageUploadMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "File too large",
        }),
      );
    });
  });
});
