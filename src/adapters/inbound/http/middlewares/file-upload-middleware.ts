import multer from "multer";
import { RequestHandler } from "express";

export interface FileUploadConfig {
  allowedMimeTypes: string[];
  maxSizeInBytes: number;
  fieldName?: string;
}

/**
 * Creates a multer middleware for file uploads with custom configuration
 */
export function createFileUploadMiddleware(
  config: FileUploadConfig,
): RequestHandler {
  const storage = multer.memoryStorage();

  const upload = multer({
    storage,
    limits: {
      fileSize: config.maxSizeInBytes,
    },
    fileFilter: (_request, file, callback) => {
      if (config.allowedMimeTypes.includes(file.mimetype)) {
        // eslint-disable-next-line unicorn/no-null
        callback(null, true);
      } else {
        callback(
          new Error(
            `Invalid file type. Allowed: ${config.allowedMimeTypes.join(", ")}`,
          ),
        );
      }
    },
  });

  return upload.single(config.fieldName ?? "file");
}

// Pre-configured middlewares for common use cases
export const pdfUploadMiddleware: RequestHandler = createFileUploadMiddleware({
  allowedMimeTypes: ["application/pdf"],
  maxSizeInBytes: 10 * 1024 * 1024, // 10MB
});

export const imageUploadMiddleware: RequestHandler = createFileUploadMiddleware(
  {
    allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    maxSizeInBytes: 5 * 1024 * 1024, // 5MB
  },
);
