import { MongoClient } from 'mongodb';
import process from 'process';

class DBClient{
  constructor (){
    const host = process.env.DB_HOST || 'localhost';
    const port = parseInt(process.env.DB_PORT || '27017');
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}`;
    this.db = await new MongoClient(url)
      .connect();
  }
}

