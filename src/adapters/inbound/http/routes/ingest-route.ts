import { Router } from "express";
import { Container } from "typedi";
import { IngestController } from "../controllers/ingest-controller.js";
import { FileUploadAdapter } from "../adapters/file-upload-adapter.js";
import { authMiddleware } from "../middlewares/auth-middleware.js";

export const createIngestRouter = (): Router => {
  const router = Router();
  const ingestController = Container.get(IngestController);

  // Configure upload adapter for PDFs
  const pdfUploadAdapter = new FileUploadAdapter({
    allowedMimeTypes: ["application/pdf"],
    maxSizeInBytes: 10 * 1024 * 1024, // 10MB
  });

  router.post(
    "/ingest",
    authMiddleware.authenticate(),
    pdfUploadAdapter.getMiddleware(),
    (request, response) => ingestController.uploadDocument(request, response),
  );

  router.get("/ingest", authMiddleware.authenticate(), (request, response) =>
    ingestController.listDocuments(request, response),
  );

  router.delete(
    "/ingest/:id",
    authMiddleware.authenticate(),
    (request, response) => ingestController.deleteDocument(request, response),
  );

  return router;
};
