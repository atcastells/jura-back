import { Router } from "express";
import { Container } from "typedi";
import { IngestController } from "../controllers/ingest-controller.js";
import { pdfUploadMiddleware } from "../middlewares/file-upload-middleware.js";
import { authMiddleware } from "../middlewares/auth-middleware.js";

export const createIngestRouter = (): Router => {
  const router = Router();
  const ingestController = Container.get(IngestController);

  router.post(
    "/ingest",
    authMiddleware.authenticate(),
    pdfUploadMiddleware,
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
