import { MongoClient } from 'mongodb';
import process from 'process';
import { createHash } from 'crypto';
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
      if (err) {console.log(client);
      }
      this.indexReady = false
      this.connected = client.isConnected();
      this.db = client.db(database);
      this.users = this.db.collection("users", {
        createCollection: true,
        validator: {
          $jsonSchema: {
            bsonType: "object",
            required: ["_id", "email"],
            properties: {
              _id: {
                bsonType: "int",
                autoIncrement: true
              }
              email: {
                bsonType: "string",
                unique: true
              }
            }
          }
        }
      });
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
  async findUser(user){
    const uCursor = await this.users.find(user);
    if (uCursor.count() === 0){
      return []
    }
    return uCursor.toArray()
  }
  async addUser(email, pass){
    const passHash = createHash('sha1').update(pass).digest('hex');
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
  async findFile(filter, pagination){
    let uCursor;
    if (pagination){
      const {page, limit} = pagination;
      uCursor = await this.files.aggregate([
        {
          $match : {filter}
        },
        {
          $skip: page * 20
        },
        {
          $limit: 20
        }
      ]);
    } else {
      uCursor = await this.files.find(filter);
    }
    if (uCursor.count() === 0){
      return []
    }
    return uCursor.toArray()
  }

  async updateFile(id, newVal){
    const ans = await this.files.updateOne(
      {"_id": id},
      {
        $set : newVal
      }
    );
    return ans
  }
  async addFile(fileOBJ){
    const fileStat = await this.files.insertOne(fileOBJ);
    if (!fileStat){
      return null
    }
    console.log(fileStat.ops);
    console.log("is the object returnwed correct");
    return fileStat.ops
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
