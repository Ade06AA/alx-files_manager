import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import { v4 as uuidv4 } from 'uuid';
import process from 'process';
import fs from 'fs';

/**
 * ==================================================
 * create and record files and folders
 * ==================================================
 * method - post
 * route - /files
 * required:
 *   name - as filename
 *   type - file type (file or image or folder)
 *   data - file or image data in base64
 * optional:
 *   parentId - id of parent (default: 0)
 *   isPublic - file is public or not (default: false)
 */
export function postUpload(req, res){
  const name = req.body.name;
  const acceptedType = ["file", "folder", "image"];
  const type = req.body.type;
  const data = req.body.data;
  const parentId = req.body.parentid || 0;
  const isPublic = (req.body.ispublic === "true") ? true : false;
  if (!name){
    res.status(400).json({"error": "Missing name"});
  }
  if (!type || !(acceptedType.includes(type))){
    res.status(400).json({"error": "Missing type"});
  }
  if (type != "folder"){
    if (!data){
      res.status(400).json({"error": "Missing data"});
    }
  }
  let userId = null; // user uniq email
  let parentFile = null;
  (async ()=>{
    const userId = req.userid;
    if (!userId){
      res.status(401).json({"error": "Unauthorized"});
    }
    if (parentId != 0){
      parentFile = await dbClient.findFile({"_id": parentId});
      if (parentFile.length != 1){
        res.status(400).json({"error": "Parent not found"});
      }
      parentFile = parentFile[0];
      if (parentFile.type != 'folder'){
        res.status(400).json({"error": "Parent is not a folder"});
      }
    }
    if (type === "folder"){
      const { _id } = await dbClient.abbFile({
        userId,
        name,
        type,
        parentId,
      });
      res.status(201).json({
        "id": _id, userId, name, type, isPublic, parentId
      });
    }
    if (type === "file" || type === "image"){
      const relative_path = process.env.FOLDER_PATH || "/tmp/files_manager";
      const file_name = uuidv4();
      const localPath = relative_path.split('/')
        .push(file_name).join('/');
      data = Buffer.from(data, 'base64');
      if (type === "image"){
        fs.writeFile(localPath, data);
      }
      if (type === "file"){
        fs.writeFile(localPath, data.toString('utf8'));
      }
      const { _id } = await dbClient.abbFile({
        userId,
        name,
        type,
        parentId,
        isPublic,
        localPath
      });
      res.status(201).json({'`id': _id, userId, name, type, isPublic, parentId});
    }
  })();
}


/**
 * ==========================================
 * retrieve the file document based on the ID
 * ==========================================
 * route - /files/:id
 * method - get
 * 
*/
export function getShow(req, res){
  const id = req.params.id;
  const userId = req.userid;
  if (!userId){
    res.status(401).json({"error": "Unauthorized"});
  }
  let files;
  (async ()=> {
    try {
      if (!id){
        files = await dbClient.get({"userId": userId});
      } else {
        files = dbClient.get({"_id": id, "userId": userId});
      }
      if (!files){
        res.code(404).json({"Not found"});
      }
      if (files.length == < 1){
        res.code(404).json({"Not found"});
      }
      if (id){
        files = files[0];
      }
      res.code(200).json(files);
    }catch (err){
      res.code(404).json({"Not found"});
    }
  })();
}

/**
 * =========================================
 * retrieve all users file documents for a 
 * specific parentId and with pagination
 * =======================================
 * route - /files
 * method - get
*/
export function getIndex(req, res){
  const parentId = req.query.parentid || 0;
  const page = req.query.page || 0;
  const userId = req.userid;
  if (!userId){
    res.status(401).json({"error": "Unauthorized"});
  }
  (async ()=> {
    try{
      const files = await dbClient.getFiles({ parentId }, {page, "limit": 20});
    } catch (err){
      res.status(401).json({"error": "Unauthorized"}); //temp
    }
  })();
}

export function putUnpublish(req, res){
  const id = req.params.id;
  const userId = req.userid;
  if (!userId){
    res.status(401).json({"error": "Unauthorized"});
  }
  let files;
  (async ()=> {
    try {
      if (!id){
        res.code(404).json({"Not found"});
      } else {
        files = dbClient.get({"_id": id, "userId": userId});
      }
      if (!files){
        res.code(404).json({"Not found"});
      }
      if (files.length == < 1){
        res.code(404).json({"Not found"});
      }
      files = files[0];
      const update = await dbClient.updateFile(files._id, {"isPublic", false});
      if (!update.acknowledged){
        res.code(404).json({"Not found"}); // temp
      }
      res.code(200).json({...files, "isPublic": false});
    }catch (err){
      res.code(404).json({"Not found"});
    }
  })();
}

/**
 * =========================================
 * retrieve all users file documents for a 
 * specific parentId and with pagination
 * =======================================
 * route - /files
 * method - get
*/
export function getIndex(req, res){
  const parentId = req.query.parentid || 0;
  const page = req.query.page || 0;
  const userId = req.userid;
  if (!userId){
    res.status(401).json({"error": "Unauthorized"});
  }
  (async ()=> {
    try{
      const files = await dbClient.getFiles({ parentId }, {page, "limit": 20});
    } catch (err){
      res.status(401).json({"error": "Unauthorized"}); //temp
    }
  })();
}

export function putPublish(req, res){
  const id = req.params.id;
  const userId = req.userid;
  if (!userId){
    res.status(401).json({"error": "Unauthorized"});
  }
  let files;
  (async ()=> {
    try {
      if (!id){
        res.code(404).json({"Not found"});
      } else {
        files = dbClient.get({"_id": id, "userId": userId});
      }
      if (!files){
        res.code(404).json({"Not found"});
      }
      if (files.length == < 1){
        res.code(404).json({"Not found"});
      }
      files = files[0];
      const update = await dbClient.updateFile(files._id, {"isPublic", true});
      if (!update.acknowledged){
        res.code(404).json({"Not found"}); // temp
      }
      res.code(200).json({...files, "isPublic": true});
    }catch (err){
      res.code(404).json({"Not found"});
    }
  })();
}