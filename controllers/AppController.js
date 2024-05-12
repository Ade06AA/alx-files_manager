import dbClient from '/utils/db';
import redisClient from '/utils/redis';

export function GetStats(req, res){
  const fileN = dbClient.nbFiles();
  const userN = dbClient.nbUsers();
  res.send(
    {
      "users": userN,
      "files": filesN,
    }
  );
}
export function GetStatus(req, res){
  const redisS = redisClient.isAlive();
  const dbS = dbClient.isAlive();
  res.send(
    {
      "redis": redisS,
      "db": dbS, 
    }
  );
}
