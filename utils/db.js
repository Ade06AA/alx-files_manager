import { MongoClient } from 'mongodb';
import process from 'process';

class DBClient{
  let connected = false;
  constructor(){
    const host = process.env.DB_HOST || 'localhost';
    const port = parseInt(process.env.DB_PORT || '27017');
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}`;
    const client= await new MongoClient(url);
    try {
      await client.connect();
      this.connected = true;
    } catch(err){
      this.connected = false;
      console.log(err);
    }
    this.connected = true;
    this.colection = client.db(database).collection('documents');
  }
  isAlive(){
    return this.connedted
  }
  async nbUsers(){
  }
  async nbFiles(){
  }
}

