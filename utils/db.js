import { MongoClient } from 'mongodb';
import process from 'process';
import crypto from 'crypto';
import { promisify } from 'util';

class DBClient{
  connected = false;
  constructor(){
    const host = process.env.DB_HOST || 'localhost';
    const port = parseInt(process.env.DB_PORT || '27017');
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}`;
    const client = new MongoClient(url, { "useUnifiedTopology": true });
    client.connect((err, client) => {
    
    if (err) {console.log(client);}
    this.indexReady = false
    this.connected = client.isConnected();
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
    this.users.createIndex(
      {"email":1},
      {"unique": true},
      ()=>{this.indexReady = true}
    );
    this.files = this.db.collection('files');
    });
  }
  isAlive(){
    return this.connected
  }
  async nbUsers(){
    const userL = await this.users.find({}).toArray();
    return userL.length
  }
  async nbFiles(){
    return await this.files.countDocuments();
  }
async findUser(email){
  const uCursor = await this.users.find({"email": email});
  if (uCursor.count() === 0){
    return null
  }
  return uCursor.toArray()
}
async addUser(email, pass){
  const passHash = crypto.createHash('sha1')
    .update(pass).digest('hex');
  let count = 0;
  while (!this.indexReady){
    if (count > 20){
      break;
    }
    count = count + 1;
  }
  const stat= await this.users.insertOne({
    "email": email,
    "password": passHash
  });
  //if (!stat.ok){
  if (!stat.result.ok){
    // handle error
    return null //temp
  }
  return {
    "email": email,
    //"id": stat.writeErrors.index
    "id": stat.insertedId.toString()
  }
}
}

const dbClient = new DBClient();
module.exports = dbClient;
