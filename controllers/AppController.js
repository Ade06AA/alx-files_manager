import dbClient from '../utils/db';
import redisClient from '../utils/redis';

export function GetStats(req, res){
  (async () => {
    const fileN = await dbClient.nbFiles();
    const userN = await dbClient.nbUsers();
    res.status(200);
    res.json(
      {
        "users": userN,
        "files": fileN,
      }
    );
  })();
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
  const email = req.body.email;
  const pass = req.body.password;
  if (!email){
    res.status(400).json({"error": "Missing email"});
  }
  if (!pass){
    res.status(400).json({"error": "Missing password"});
  }
  dbClient.addUser(email, pass)
    .then((addU) => {
      res.status(201).json(addU);
    }).catch((err) => {
      if (err.code === 11000){
        res.status(400).json({"error": "Already exist"});
      }
      else {
        res.status(400).end();
      }
    });
}
