// Example of how to use the DatabaseConnection in a repository implementation
import { Service, Inject } from 'typedi';
import { DatabaseConnection } from '../../../../../domain/services/DatabaseConnection';

@Service()
export class ExampleRepository {
  constructor(
    @Inject('DatabaseConnection') private databaseConnection: DatabaseConnection
  ) {
    console.log('ExampleRepository initialized with DatabaseConnection');
  }

  async findAll() {
    const db = this.databaseConnection.getDb();
    const collection = db.collection('examples');
    return await collection.find({}).toArray();
  }

  async create(data: any) {
    const db = this.databaseConnection.getDb();
    const collection = db.collection('examples');
    return await collection.insertOne(data);
  }
}