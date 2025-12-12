import { Db } from "mongodb";

export interface DatabaseConnection {
  connect(uri: string, databaseName: string): Promise<void>;
  getDb(): Db;
  disconnect(): Promise<void>;
  isConnected(): boolean;
}
