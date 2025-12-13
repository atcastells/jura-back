import "reflect-metadata";
import { Container } from "typedi";
import { config } from "../src/infrastructure/config.js";
import { SupabaseClient } from "../src/adapters/outbound/authentication/supabase-client.js";
import { GeminiAdapter } from "../src/adapters/outbound/external-services/gemini-adapter.js";
import { LangChainGeminiAdapter } from "../src/adapters/outbound/external-services/lang-chain-gemini-adapter.js";
import { GeminiEmbeddingAdapter } from "../src/adapters/outbound/external-services/gemini-embedding-adapter.js";
import { SupabaseVectorStore } from "../src/adapters/outbound/persistence/supabase/supabase-vector-store.js";
import { RagService } from "../src/application/services/rag-service.js";
import { RetrieveContextUseCase } from "../src/application/services/retrieve-context.use-case.js";
import { DocumentChunk } from "../src/domain/entities/document-chunk.js";

async function main() {
  console.log("Setting up dependencies...");

  // Manually register dependencies since we are not using the full app.ts container setup
  const supabaseClient = new SupabaseClient(
    config.supabase.url,
    config.supabase.anonKey,
    config.supabase.serviceRoleKey,
  );
  Container.set(SupabaseClient, supabaseClient);

  const geminiAdapter = new GeminiAdapter();
  Container.set(GeminiAdapter, geminiAdapter);

  const langChainAdapter = new LangChainGeminiAdapter(geminiAdapter);
  Container.set(LangChainGeminiAdapter, langChainAdapter);

  const embeddingService = new GeminiEmbeddingAdapter();
  Container.set(GeminiEmbeddingAdapter, embeddingService);

  const vectorStore = new SupabaseVectorStore(supabaseClient);
  Container.set(SupabaseVectorStore, vectorStore);

  const retrieveContext = new RetrieveContextUseCase(
    embeddingService,
    vectorStore,
  );
  Container.set(RetrieveContextUseCase, retrieveContext);

  const ragService = new RagService(retrieveContext, langChainAdapter);

  const userId = "00000000-0000-0000-0000-000000000000"; // Test UUID
  const docId = "11111111-1111-1111-1111-111111111111"; // Test Doc UUID

  console.log("1. Creating dummy document chunk...");
  const text =
    "Jura is an AI-powered recruitment platform that helps recruiters screen candidates faster.";
  const embedding = await embeddingService.embedQuery(text);

  const chunk: DocumentChunk = {
    id: "22222222-2222-2222-2222-222222222222",
    documentId: docId,
    userId: userId,
    content: text,
    embedding: embedding,
    metadata: { source: "test-script" },
    chunkIndex: 0,
  };

  console.log("2. Storing chunk...");
  await vectorStore.addDocuments([chunk]);

  console.log("3. Asking question...");
  const question = "What is Jura?";
  const answer = await ragService.answerQuery(userId, question);

  console.log("\n--- ANSWER ---");
  console.log(answer);
  console.log("--------------\n");

  if (answer.toLowerCase().includes("recruitment platform")) {
    console.log("✅ SUCCESS: RAG pipeline working!");
    process.exit(0);
  } else {
    console.error("❌ FAILURE: Answer did not contain expected content.");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
