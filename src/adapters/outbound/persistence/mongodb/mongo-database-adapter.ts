import { Service } from "typedi";
import { MongoClient, Db } from "mongodb";
import { DatabaseConnection } from "../../../../domain/services/database-connection.js";

@Service()
export class MongoDBAdapter implements DatabaseConnection {
  private client: MongoClient | undefined = undefined;
  private db: Db | undefined = undefined;

  constructor() {
    console.log("Initializing MongoDBAdapter");
  }

  async connect(uri: string, databaseName: string): Promise<void> {
    if (this.client) {
      console.log("Already connected to MongoDB");
      return;
    }

    try {
      this.client = new MongoClient(uri);
      await this.client.connect();
      this.db = this.client.db(databaseName);
      console.log("Connected to MongoDB");
    } catch (error) {
      console.error("MongoDB connection error:", error);
      throw error;
    }
  }

  getDb(): Db {
    if (!this.db) {
      throw new Error("Database not initialized. Call connect() first.");
    }
    return this.db;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = undefined;
      this.db = undefined;
      console.log("Disconnected from MongoDB");
    }
  }

  isConnected(): boolean {
    return this.client !== undefined && this.db !== undefined;
  }
}
