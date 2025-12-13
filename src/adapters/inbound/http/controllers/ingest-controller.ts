import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middlewares/auth-middleware.js";
import { Service } from "typedi";
import { UploadDocumentUseCase } from "../../../../application/documents/upload-document.use-case.js";
import { ListDocumentsUseCase } from "../../../../application/documents/list-documents.use-case.js";
import { DeleteDocumentUseCase } from "../../../../application/documents/delete-document.use-case.js";
import { DocumentCategory } from "../../../../domain/entities/document.js";
import { HttpError } from "../errors/http-error.js";

@Service()
export class IngestController {
  constructor(
    private uploadDocumentUseCase: UploadDocumentUseCase,
    private listDocumentsUseCase: ListDocumentsUseCase,
    private deleteDocumentUseCase: DeleteDocumentUseCase,
  ) {}

  async uploadDocument(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!request.file) {
        throw new HttpError(400, "No file provided");
      }

      const user = (request as AuthenticatedRequest).user;
      if (!user) {
        throw new HttpError(401, "Unauthorized");
      }
      const userId = user.id;

      const { category } = request.body;

      const document = await this.uploadDocumentUseCase.execute(
        userId,
        request.file,
        category as DocumentCategory,
      );

      response.status(200).json({
        message: "File uploaded successfully",
        document,
      });
    } catch (error) {
      next(error);
    }
  }

  async listDocuments(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user = (request as AuthenticatedRequest).user;
      if (!user) {
        throw new HttpError(401, "Unauthorized");
      }
      const userId = user.id;

      const documents = await this.listDocumentsUseCase.execute(userId);
      response.status(200).json({ documents });
    } catch (error) {
      next(error);
    }
  }

  async deleteDocument(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params;
      const user = (request as AuthenticatedRequest).user;
      if (!user) {
        throw new HttpError(401, "Unauthorized");
      }
      const userId = user.id;

      await this.deleteDocumentUseCase.execute(id, userId);
      response.status(200).json({ message: "Document deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}
