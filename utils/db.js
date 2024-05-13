import { MongoClient } from 'mongodb';
import process from 'process';
import crypto from 'crypto';

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
    this.users = this.db.collection("users", {
      createCollection: true,
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["_id"],
          properties: {
            _id: {
              bsonType: "int",
              autoIncrement: true
            }
          }
        }
      }
    });
    this.files = this.db.collection('files');
  }
  isAlive(){
    return this.connedted
  }
  async nbUsers(){
    const userL = await this.users.find({}).toArray();
    return userL.length
  }
  async nbFiles(){
    const fCursor = await this.files.find({});
    return fCursor.count()
  }
}
async findUser(email){
  const uCursor = await this.users.find({"email": email});
  if (uCursor.count() === 0){
    return null
  }
  return uCursor.toArray()
}
async addUser(email, pass){
  passHash = crypto.createHash('sha1')
    .update(pass).digest('hex');
  const stat= this.users.insertOne({
    "email": email,
    "password": passHash
  });
  if (!stat.ok){
    // handle error
    return null //temp
  }
  return {
    "email": email,
    "id": stat.writeErrors.index
  }
}

const dbClient = DBClient();
module.exports = dbClient;
