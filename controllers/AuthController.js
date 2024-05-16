import dbClient from '../utils/db';
import { ObjectId } from 'mongodb';
import redisClient from '../utils/redis';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export function getConnect(req, res){
  let authToken = req.headers["authorization"];
  if (!authToken){
    res.status(401).json({ "error": "Unauthorized"});
  }
  if (!authToken.startsWith("Basic ")){
    res.status(401).json({ "error": "Unauthorized"});
  }
  try {
    authToken = atob(authToken.trim().split(' ', 2)[1]);
  } catch (err){
    res.status(401).json({ "error": "Unauthorized"});
  }
  let [ email, pwd ] = authToken.split(":", 2);
  if (!email || !pwd){
    res.status(401).json({ "error": "Unauthorized"});
  }
  pwd =  createHash('sha1').update(pwd).digest('hex');
  dbClient.findUser({"email": email, "password": pwd})
    .then((user)=>{
      if (!user){
        res.status(401).json({ "error": "Unauthorized"});
      }
      const Token = uuidv4();
      const key = `auth_${Token}`;
      redisClient.set(key, user[0]._id, 86400)
        .then(()=>{
          res.status(200).json({"token": Token});
        }).catch((err)=>{
          res.status(401).json({ "error": "Unauthorized"});
        });
    }).catch((err)=>{
      res.status(401).json({ "error": "Unauthorized"});
    });
}

export function getDisconnect(req, res){
  const _id = req.userid;
  if (!_id){
    res.status(401).json({ "error": "Unauthorized"});
    return
  }
  dbClient.findUser({"_id": _id})
    .then((user)=>{
      if (!user){
        res.status(401).json({ "error": "Unauthorized"});
        return
      }
      redisClient.del(`auth_${req.headers["x-token"]}`)
        .then((count)=>{
          res.status(204).end();
          return
        });
    }).catch((err)=>{
        res.status(401).json({ "error": "Unauthorized"});
    });
}

export function getMe(req, res){
  const _id = req.userid;
  dbClient.findUser({"_id": _id})
    .then((user)=>{
      if (user.length <= 0){
        res.status(401).json({ "error": "Unauthorized"});
        return
      }
      res.status(200).json({"id": user[0]._id, "email": user[0].email});
    }).catch((err)=>{
       res.status(400).end();
    });
}
