import "reflect-metadata";
import { startTelemetry } from "./telemetry.js";

// Initialize telemetry before anything else
startTelemetry();

import { createApp } from "../adapters/inbound/http/app.js";
import { MongoDBAdapter } from "../adapters/outbound/persistence/mongodb/mongo-database-adapter.js";
import { Container } from "typedi";
import { GeminiAdapter } from "../adapters/outbound/external-services/gemini-adapter.js";
import { LangChainGeminiAdapter } from "../adapters/outbound/external-services/lang-chain-gemini-adapter.js";
import { ConversationAgentFactory } from "../adapters/inbound/primary/agents/conversation-agent-factory.js";
import { SupabaseClient } from "../adapters/outbound/authentication/supabase-client.js";
import { ToolRegistry } from "../adapters/outbound/external-services/tools/tool-registry.js";
import { MongoUserRepository } from "../adapters/outbound/persistence/mongodb/mongo-user-repository.js";
import { MongoDocumentRepository } from "../adapters/outbound/persistence/mongodb/mongo-document-repository.js";
import { MongoAgentRepository } from "../adapters/outbound/persistence/mongodb/mongo-agent-repository.js";
import { MongoChatRepository } from "../adapters/outbound/persistence/mongodb/mongo-chat-repository.js";
import {
  AUTH_REPOSITORY,
  DOCUMENT_REPOSITORY,
  AGENT_REPOSITORY,
  CHAT_REPOSITORY,
} from "./constants.js";
import { config } from "./config.js";
try {
  // Check required config
  if (!config.mongo.uri) {
    throw new Error("MONGO_URI environment variable is required");
  }
  if (!config.supabase.url) {
    throw new Error("SUPABASE_URL environment variable is required");
  }
  if (!config.supabase.anonKey) {
    throw new Error("SUPABASE_ANON_KEY environment variable is required");
  }
  if (!config.supabase.serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY environment variable is required",
    );
  }

  // Register AI services in the DI container
  // First register the base GeminiAdapter
  Container.set(GeminiAdapter, Container.get(GeminiAdapter));

  // Register the LangChain wrapper as 'AIService' for LangChain compatibility
  Container.set("AIService", Container.get(LangChainGeminiAdapter));

  // Also make LangChain adapter available by its class name
  Container.set(LangChainGeminiAdapter, Container.get(LangChainGeminiAdapter));

  // Register ToolRegistry and ConversationAgentFactory for the agent
  Container.set(ToolRegistry, Container.get(ToolRegistry));
  Container.set(
    ConversationAgentFactory,
    Container.get(ConversationAgentFactory),
  );

  const supabaseClient = new SupabaseClient(
    config.supabase.url,
    config.supabase.anonKey,
    config.supabase.serviceRoleKey,
  );

  // Register external services
  Container.set(SupabaseClient, supabaseClient);

  console.log("AI Service initialized with LangChain Gemini adapter");
  console.log("Supabase Client initialized");

  // Register and connect to MongoDB
  const databaseConnection = Container.get(MongoDBAdapter);
  Container.set("DatabaseConnection", databaseConnection);
  await databaseConnection.connect(config.mongo.uri, config.mongo.dbName);

  // Register Repositories
  const mongoUserRepository = Container.get(MongoUserRepository);
  Container.set(AUTH_REPOSITORY, mongoUserRepository);

  // Register Document Repository
  const mongoDocumentRepository = Container.get(MongoDocumentRepository);
  Container.set(DOCUMENT_REPOSITORY, mongoDocumentRepository);

  // Register Agent Repository
  const mongoAgentRepository = Container.get(MongoAgentRepository);
  Container.set(AGENT_REPOSITORY, mongoAgentRepository);

  // Register Chat Repository
  const mongoChatRepository = Container.get(MongoChatRepository);
  Container.set(CHAT_REPOSITORY, mongoChatRepository);

  // Create Express app
  const app = await createApp();

  // Start server
  app.listen(config.port, () => {
    const baseUrl = `http://localhost:${config.port}`;
    console.log("\n");
    console.log("╔══════════════════════════════════════════════════════════╗");
    console.log("║                                                          ║");
    console.log("║   🚀  JURA API SERVER                                    ║");
    console.log("║                                                          ║");
    console.log("╠══════════════════════════════════════════════════════════╣");
    console.log("║                                                          ║");
    console.log(`║   📡  Base URL:     ${baseUrl.padEnd(36)}║`);
    console.log(`║   📚  API Docs:     ${(baseUrl + "/docs").padEnd(36)}║`);
    console.log(
      `║   📋  OpenAPI:      ${(baseUrl + "/openapi.json").padEnd(36)}║`,
    );
    console.log(`║   💚  Health:       ${(baseUrl + "/health").padEnd(36)}║`);
    console.log("║                                                          ║");
    console.log("╚══════════════════════════════════════════════════════════╝");
    console.log("\n");
  });

  // Graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\nShutting down gracefully...");
    await databaseConnection.disconnect();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("\nShutting down gracefully...");
    await databaseConnection.disconnect();
    process.exit(0);
  });
} catch (error) {
  console.error("Failed to start server:", error);
  throw error;
}
