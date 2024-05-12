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
    this.db = client.db(database);
  }
  isAlive(){
    return this.connedted
  }
  async nbUsers(){
    const users = this.db.collection('users');
    const userL = await users.find({}).toArray();
    return userL.length
  }
  async nbFiles(){
    const files = this.db.collection('files');
    const fileL = await files.find({}).toArray();
    return fileL.length
  }
}

const dbClient = DBClient();
module.exports = dbClient;
