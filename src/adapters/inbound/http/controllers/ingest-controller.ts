import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth-middleware.js";
import { Service } from "typedi";
import { UploadDocumentUseCase } from "../../../../application/documents/upload-document.use-case.js";
import { ListDocumentsUseCase } from "../../../../application/documents/list-documents.use-case.js";
import { DeleteDocumentUseCase } from "../../../../application/documents/delete-document.use-case.js";
import { DocumentCategory } from "../../../../domain/entities/document.js";

@Service()
export class IngestController {
  constructor(
    private uploadDocumentUseCase: UploadDocumentUseCase,
    private listDocumentsUseCase: ListDocumentsUseCase,
    private deleteDocumentUseCase: DeleteDocumentUseCase,
  ) {}

  async uploadDocument(request: Request, response: Response): Promise<void> {
    try {
      if (!request.file) {
        response.status(400).json({ error: "No file provided" });
        return;
      }

      const user = (request as AuthenticatedRequest).user;
      if (!user) {
        response.status(401).json({ error: "Unauthorized" });
        return;
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
      console.error("Upload error:", error);
      response.status(500).json({ error: "Failed to upload document" });
    }
  }

  async listDocuments(request: Request, response: Response): Promise<void> {
    try {
      const user = (request as AuthenticatedRequest).user;
      if (!user) {
        response.status(401).json({ error: "Unauthorized" });
        return;
      }
      const userId = user.id;

      const documents = await this.listDocumentsUseCase.execute(userId);
      response.status(200).json({ documents });
    } catch (error) {
      console.error("List documents error:", error);
      response.status(500).json({ error: "Failed to list documents" });
    }
  }

  async deleteDocument(request: Request, response: Response): Promise<void> {
    try {
      const { id } = request.params;
      const user = (request as AuthenticatedRequest).user;
      if (!user) {
        response.status(401).json({ error: "Unauthorized" });
        return;
      }
      const userId = user.id;

      await this.deleteDocumentUseCase.execute(id, userId);
      response.status(200).json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error("Delete document error:", error);
      response.status(500).json({ error: "Failed to delete document" });
    }
  }
}
