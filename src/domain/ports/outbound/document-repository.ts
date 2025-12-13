import { Document } from "../../entities/document.js";

export interface DocumentRepository {
  save(document: Document): Promise<Document>;
  findById(id: string): Promise<Document | undefined>;
  findByUserId(userId: string): Promise<Document[]>;
  delete(id: string): Promise<void>;
}
