import { Router } from "express";
import { Container } from "typedi";
import { IngestController } from "../controllers/ingest-controller.js";
import { pdfUploadMiddleware } from "../middlewares/file-upload-middleware.js";
import { authMiddleware } from "../middlewares/auth-middleware.js";
import { validateRequest } from "../middlewares/validate-request.js";
import { uploadDocumentSchema } from "../middlewares/validation-schemas.js";

export const createIngestRouter = (): Router => {
  const router = Router();
  const ingestController = Container.get(IngestController);

  router.post(
    "/ingest",
    authMiddleware.authenticate(),
    pdfUploadMiddleware,
    validateRequest(uploadDocumentSchema),
    (request, response, next) =>
      ingestController.uploadDocument(request, response, next),
  );

  router.get(
    "/ingest",
    authMiddleware.authenticate(),
    (request, response, next) =>
      ingestController.listDocuments(request, response, next),
  );

  router.delete(
    "/ingest/:id",
    authMiddleware.authenticate(),
    (request, response, next) =>
      ingestController.deleteDocument(request, response, next),
  );

  return router;
};
