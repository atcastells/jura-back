import multer from "multer";
import { RequestHandler } from "express";

export interface FileUploadConfig {
  allowedMimeTypes: string[];
  maxSizeInBytes: number;
}

export class FileUploadAdapter {
  private config: FileUploadConfig;

  constructor(config: FileUploadConfig) {
    this.config = config;
  }

  getMiddleware(): RequestHandler {
    const storage = multer.memoryStorage();

    const upload = multer({
      storage,
      limits: {
        fileSize: this.config.maxSizeInBytes,
      },
      fileFilter: (_request, file, callback) => {
        if (this.config.allowedMimeTypes.includes(file.mimetype)) {
          // eslint-disable-next-line unicorn/no-null
          callback(null, true);
        } else {
          callback(
            new Error(
              `Invalid file type. Allowed: ${this.config.allowedMimeTypes.join(", ")}`,
            ),
          );
        }
      },
    });

    return upload.single("file");
  }
}
