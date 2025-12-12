import express, { Application } from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import { errorHandler } from "./middlewares/error-handler.js";
import { authRouter } from "./routes/auth-routes.js";

// Load OpenAPI spec
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const openApiPath = path.join(
  __dirname,
  "../../../infrastructure/openapi.yaml",
);
const openApiSpec = YAML.parse(fs.readFileSync(openApiPath, "utf8"));

export const createApp = async (): Promise<Application> => {
  const app = express();

  // Middlewares
  app.use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
      allowedHeaders: ["*"],
      credentials: true,
      optionsSuccessStatus: 204,
    }),
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging middleware
  app.use((request, _response, next) => {
    console.log(
      `[${new Date().toISOString()}] ${request.method} ${request.path}`,
    );
    if (request.headers.authorization) {
      console.log(
        `  Authorization: ${request.headers.authorization.slice(0, 20)}...`,
      );
    }
    next();
  });

  // Routes
  app.use("/auth", authRouter);

  // API Documentation with Scalar (dynamic import for ESM compatibility)
  const { apiReference } = await import("@scalar/express-api-reference");
  app.use(
    "/docs",
    apiReference({
      spec: {
        content: openApiSpec,
      },
      theme: "purple",
    } as Parameters<typeof apiReference>[0]),
  );

  // Serve raw OpenAPI spec
  app.get("/openapi.json", (_request, response) => {
    response.json(openApiSpec);
  });

  // Health check
  app.get("/health", (_request, response) => {
    response
      .status(200)
      .json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Error handler
  app.use(errorHandler);

  return app;
};
