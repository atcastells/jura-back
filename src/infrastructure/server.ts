import 'reflect-metadata';
import dotenv from 'dotenv';
import { createApp } from '../adapters/inbound/http/app';
import { MongoDBAdapter } from '../adapters/outbound/persistence/mongodb/MongoDBAdapter';
import { Container } from 'typedi';
import { GeminiAdapter } from '../adapters/outbound/external-services/GeminiAdapter';
import { LangChainGeminiAdapter } from '../adapters/outbound/external-services/LangChainGeminiAdapter';
import { ConversationAgentFactory } from '../adapters/inbound/primary/agents/ConversationAgentFactory';
import { ToolRegistry } from '../adapters/outbound/external-services/tools/ToolRegistry';

dotenv.config();

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  throw new Error('MONGO_URI environment variable is required');
}

async function startServer() {
  try {

    // Register AI services in the DI container
    // First register the base GeminiAdapter
    Container.set(GeminiAdapter, Container.get(GeminiAdapter));

    // Register the LangChain wrapper as 'AIService' for LangChain compatibility
    Container.set('AIService', Container.get(LangChainGeminiAdapter));

    // Also make LangChain adapter available by its class name
    Container.set(LangChainGeminiAdapter, Container.get(LangChainGeminiAdapter));

    // Register ToolRegistry and ConversationAgentFactory for the agent
    Container.set(ToolRegistry, Container.get(ToolRegistry));
    Container.set(ConversationAgentFactory, Container.get(ConversationAgentFactory));

    console.log('AI Service initialized with LangChain Gemini adapter');

    // Register and connect to MongoDB
    const dbConnection = Container.get(MongoDBAdapter);
    Container.set('DatabaseConnection', dbConnection);
    await dbConnection.connect(MONGODB_URI!, 'scora');

    // Create Express app
    const app = createApp();

    // Start server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\nShutting down gracefully...');
      await dbConnection.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\nShutting down gracefully...');
      await dbConnection.disconnect();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
