import { MongoClient, ObjectId } from 'mongodb';
import process from 'process';
import { createHash } from 'crypto';
import { promisify } from 'util';

function convertIdToStr(obj) {
  try {
    if (obj.hasOwnProperty('_id')) {
      obj._id = obj._id.toString();
    }
    if (obj.hasOwnProperty('userId')) {
      obj.userId = obj.userId.toString();
    }
    if (obj.hasOwnProperty('parentId')) {
      if (obj.parentId !== '0') {
        obj.parentId = obj.parentId.toString();
      }
    }
  } catch (err) {
    console.log(err);
  }
  return obj;
}

function convertIdToObj(obj) {
  console.log('2r4c3n4tc3tt35t38');
  console.log(obj);
  try {
    if (obj.hasOwnProperty('_id')) {
      obj._id = ObjectId(obj._id);
    }
    if (obj.hasOwnProperty('userId')) {
      obj.userId = ObjectId(obj.userId);
    }
    console.log(obj);
    if (obj.hasOwnProperty('parentId')) {
      if (obj.parentId !== '0') {
        obj.parentId = ObjectId(obj.parentId);
      }
    }
  } catch (err) {
    console.log(err);
  }
  console.log('2r4c3n4tc3tt35t38');
  return obj;
}

class DBClient {
  constructor() {
    this.connected = false;
    const host = process.env.DB_HOST || 'localhost';
    const port = parseInt(process.env.DB_PORT || '27017', null);
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}`;
    const client = new MongoClient(url, { useUnifiedTopology: true });
    client.connect((err, client) => {
      if (err) console.log(client);
      this.indexReady = false;
      this.connected = client.isConnected();
      this.db = client.db(database);
      this.files = this.db.collection('files');
      this.users = this.db.collection('users');
      this.users.createIndex({ email: 1 }, { unique: true });
    });
  }
  isAlive() {
    return this.connected;
  }
  async nbUsers() {
    const userL = await this.users.find({}).toArray();
    return userL.length;
  }
  async nbFiles() {
    return this.files.countDocuments();
  }
  async findUser(user) {
    const uCursor = await this.users.find(convertIdToObj(user));

    if (uCursor.count() === 0) {
      return [];
    }

    return uCursor.toArray().map((dict) => convertIdToObj(dict));
  }
  async addUser(email, pass) {
    const passHash = createHash('sha1').update(pass).digest('hex');
    let count = 0;
    while (!this.indexReady) {
      if (count > 20) {
        break;
      }
      count += 1;
    }
    const stat = await this.users.insertOne({
      email,
      password: passHash,
    });
    if (!stat.result.ok) {
      // handle error
      return null; // temp
    }
    return {
      email,
      // 'id': stat.writeErrors.index
      id: stat.insertedId.toString(),
    };
  }
  async findFile(filter, pagination) {
    let uCursor;
    filter = convertIdToObj(filter);
    if (pagination) {
      const { page, limit } = pagination;
      console.log(page, limit);
      uCursor = await this.files.aggregate([
        {
          $match: filter,
        },
        {
          $skip: page * 20,
        },
        {
          $limit: 20,
        },
      ]);
    } else {
      console.log('sdd', filter);
      uCursor = await this.files.find(filter).map((dict) => convertIdToStr(dict));
      console.log('sdd', (await uCursor.toArray()));
    }
    return uCursor.toArray();
  }

  async updateFile(id, newVal) {
    const ans = await this.files.updateOne(
      { _id: ObjectId(id) },
      {
        $set: convertIdToObj(newVal),
      },
    );
    return ans;
  }
  async addFile(fileOBJ) {
    const fileStat = await this.files.insertOne(convertIdToObj(fileOBJ));
    if (!fileStat) {
      return null;
    }
    return fileStat.ops[0]._id;
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
