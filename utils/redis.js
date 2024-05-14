import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient{
  #connected = false;
  constructor(){
    this.client = createClient();
    this.#connected = true;
    this.client.on('error', err => {
      this.#connected = false;
      console.log(err);
    });
    this.client.on('connect', () => {this.#connected = true});
  }
  isAlive() {
    //return promisify(this.client.ping).bind(this.client)()i
    return this.#connected
  }

  async get(key){
    //return await this.client.GET(key);
    return promisify(this.client.GET).bind(this.client)(key);
  }

  async set(key, val, ex){
    await promisify(this.client.SETEX).bind(this.client)(key, ex, val);
  }

  async del(key){
    const count = await promisify(this.client.DEL).bind(this.client)(key);
    return count
  }
}
const redisClient = new RedisClient()

module.exports = redisClient;
