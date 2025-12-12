import { Service } from 'typedi';
import { MongoClient, Db } from 'mongodb';
import { DatabaseConnection } from '../../../../domain/services/DatabaseConnection';

@Service()
export class MongoDBAdapter implements DatabaseConnection {
  private client: MongoClient | null = null;
  private db: Db | null = null;

  constructor() {
    console.log('Initializing MongoDBAdapter');
  }

  async connect(uri: string, dbName: string): Promise<void> {
    if (this.client) {
      console.log('Already connected to MongoDB');
      return;
    }

    try {
      this.client = new MongoClient(uri);
      await this.client.connect();
      this.db = this.client.db(dbName);
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  getDb(): Db {
    if (!this.db) {
      throw new Error('Database not initialized. Call connect() first.');
    }
    return this.db;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      console.log('Disconnected from MongoDB');
    }
  }

  isConnected(): boolean {
    return this.client !== null && this.db !== null;
  }
}