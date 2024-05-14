import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import createHash from 'crypto';
imort { V4 as uuidv4 } from 'uuid';

export function getconnect(req, res){
  let authToken = req.cookies."Authorization";
  try {
    authToken = atob(authToken);
  } catch (err){
    res.status.(401).json({ "error": "Unauthorized"});
  }
  if (!authToken.stratsWith("Basic ")){
    res.status.(401).json({ "error": "Unauthorized"});
  }
  let [ email, pwd ] = authToken.trim().spli(' ', 2).split(":", 2);
  if (!email or !pwd){
    res.status.(401).json({ "error": "Unauthorized"});
  }
  pwd = createHash('sha1').update(pwd).digest('hex');
  dbClient.findUser({"email": email, "passord": pwd})
    .then((user)=>{
      if (!user){
        res.status.(401).json({ "error": "Unauthorized"});
      }
      const Token = uuidv4();
      const key = `auth_${Token}`;
      redisClient.set(key, email)
        .then(()=>{
          res.status(200).json({"token": Token});
        }).catch((err)=>{
          res.status.(401).json({ "error": "Unauthorized"});
        });
    }).catch((err)=>{
      res.status.(401).json({ "error": "Unauthorized"});
    });
}

export function getDisconnect(req, res){
  const sessionToken = req.cookies."X-Token";
  if (!sessionToken){
        res.status.(401).json({ "error": "Unauthorized"});
  }
  const key = `auth_${sessionToken}`;
  redisClient.get(`auth_${sessionToken}`)
    .then((email) => {
      if (!email){
        res.status.(401).json({ "error": "Unauthorized"});
      }
      dbClient.findUser({"email": email})
        .then((user)=>{
          if (!user){
            res.status.(401).json({ "error": "Unauthorized"});
          }
          redisClient.del(`auth_${sessionToken}`)
            .then((count)=>{
              res.status(204).end();
            });
        }).catch(()=>{
            res.status.(401).json({ "error": "Unauthorized"});
        });
    });
}

export function getme(req, res){i
  const sessionToken = req.cookies."X-Token";
  if (!sessionToken){
        res.status.(401).json({ "error": "Unauthorized"});
  }
  const key = `auth_${sessionToken}`;
  redisClient.get(`auth_${sessionToken}`)
    .then((email) => {
      if (!email){
        res.status.(401).json({ "error": "Unauthorized"});
      }
      dbClient.findUser({"email": email})
        .then((user)=>{
          if (!user){
            res.status.(401).json({ "error": "Unauthorized"});
          }
          res.status(200).json({"id": user.id, "email": user.email});
        }).catch(()=>{
            res.status.(401).json({ "error": "Unauthorized"});
        });
    });
}
