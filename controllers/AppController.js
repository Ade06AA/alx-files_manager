import dbClient from '/utils/db';
import redisClient from '/utils/redis';

export function GetStats(req, res){
  const fileN = dbClient.nbFiles();
  const userN = dbClient.nbUsers();
  res.status(200);
  res.json(
    {
      "users": userN,
      "files": filesN,
    }
  );
}
export function GetStatus(req, res){
  const redisS = redisClient.isAlive();
  const dbS = dbClient.isAlive();
  res.status(200);
  res.json(
    {
      "redis": redisS,
      "db": dbS, 
    }
  );
}

export function NewUser(req, res){
  const email = req.data; /temp
  const pass = req.data; //temp
  if (!email){
    res.status(400).json("Missing email");
  }
  if (!pass){
    res.status(400).json("Missing password");
  }
  if (dbClient.findUser(email)){
    res.status(400).json("Already exist");
  }
  const addU = dbClient.addUser(email, pass);
  if (!addU){
    res.satus(400).json("Error while adding user");
  }
  res.status(201)
    .json(addU);
}
