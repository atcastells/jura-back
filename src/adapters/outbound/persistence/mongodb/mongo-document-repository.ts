import { Service, Inject } from "typedi";
import { Document } from "../../../../domain/entities/document.js";
import { DocumentRepository } from "../../../../domain/ports/outbound/document-repository.js";
import { MongoDBAdapter } from "./mongo-database-adapter.js";
import { ObjectId, WithId, Filter } from "mongodb";
import { documentSchema, DocumentSchema } from "./schemas/document.schema.js";

@Service()
export class MongoDocumentRepository implements DocumentRepository {
  constructor(
    @Inject(() => MongoDBAdapter)
    private readonly databaseConnection: MongoDBAdapter,
  ) {}

  private get collection() {
    return this.databaseConnection
      .getDb()
      .collection<DocumentSchema>("documents");
  }

  async save(document: Document): Promise<Document> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...documentData } = document;

    // Validate with Zod
    const validatedData = documentSchema.parse(documentData);

    const result = await this.collection.insertOne(validatedData);

    return {
      ...validatedData,
      id: result.insertedId.toString(),
    };
  }

  async findById(id: string): Promise<Document | undefined> {
    if (!ObjectId.isValid(id)) return undefined;

    const document = await this.collection.findOne({
      _id: new ObjectId(id),
    } as Filter<DocumentSchema>);

    if (!document) return undefined;

    return this.mapDocument(document);
  }

  async findByUserId(userId: string): Promise<Document[]> {
    const documents = await this.collection.find({ userId }).toArray();
    return documents.map((document) => this.mapDocument(document));
  }

  async delete(id: string): Promise<void> {
    if (!ObjectId.isValid(id)) return;

    await this.collection.deleteOne({
      _id: new ObjectId(id),
    } as Filter<DocumentSchema>);
  }

  private mapDocument(document: WithId<DocumentSchema>): Document {
    const { _id, ...rest } = document;
    return {
      id: _id.toString(),
      ...rest,
    };
  }
}
