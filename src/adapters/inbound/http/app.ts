import express, { Application } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import { errorHandler } from './middlewares/errorHandler';

// Load OpenAPI spec
const openApiPath = path.join(__dirname, '../../../infrastructure/openapi.yaml');
const openApiSpec = YAML.parse(fs.readFileSync(openApiPath, 'utf8'));

export const createApp = async (): Promise<Application> => {
  const app = express();

  // Middlewares
  app.use(
    cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
      allowedHeaders: ['*'],
      credentials: true,
      optionsSuccessStatus: 204,
    }),
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging middleware
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    if (req.headers.authorization) {
      console.log(`  Authorization: ${req.headers.authorization.substring(0, 20)}...`);
    }
    next();
  });

  // API Documentation with Scalar (dynamic import for ESM compatibility)
  const { apiReference } = await import('@scalar/express-api-reference');
  app.use(
    '/docs',
    apiReference({
      spec: {
        content: openApiSpec,
      },
      theme: 'purple',
    } as Parameters<typeof apiReference>[0]),
  );

  // Serve raw OpenAPI spec
  app.get('/openapi.json', (_req, res) => {
    res.json(openApiSpec);
  });

  // Health check
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Error handler
  app.use(errorHandler);

  return app;
};
