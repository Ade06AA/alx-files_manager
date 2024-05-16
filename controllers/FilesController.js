import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import { v4 as uuidv4 } from 'uuid';
import process from 'process';
import fs from 'fs';
import { contentType } from 'mime-types';
import { join as joinPath } from 'path';
import { tmpdir } from 'os';
import { promisify } from 'util';

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
  const parentId = req.body.parentid ||"0";
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
      const relative_path = process.env.FOLDER_PATH || joinPath(tmpdir(), "/tmp/files_manager");
      const file_name = uuidv4();
      const localPath = joinPath(relative_path, file_name);
      await (promisify(fs.mkdir))(relative_path, {recursive: true});
      data = Buffer.from(data, 'base64');
      fs.writeFileAsync(localPath, data);
      const { _id } = await dbClient.abbFile({
        userId,
        name,
        type,
        parentId,
        isPublic,
        localPath
      });
      /**
       * start  thumbnail generator worker
       */
      if (type === "image"){
        const jobName = `Image thumbnail [${userId}-${_id}]`;
        const fileQueue = new Queue("thumbnail generation");
        fileQueue.add({userId, "fileId": _id, "name": jobName});
      }
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
        files = await dbClient.findFile({"userId": userId});
      } else {
        files = dbClient.findFile({"_id": id, "userId": userId});
      }
      if (!files){
        res.status(404).json({"error": "Not found"});
      }
      if (files.length != 1){
        res.status(404).json({"error": "Not found"});
      }
      if (id){
        files = files[0];
      }
      res.status(200).json(files);
    }catch (err){
      res.status(404).json({"error": "Not found"});
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
        res.status(404).json({"error": "Not found"});
      } else {
        files = dbClient.findFile({"_id": id, "userId": userId});
      }
      if (!files){
        res.status(404).json({"error": "Not found"});
      }
      if (files.length != 1){
        res.status(404).json({"error": "Not found"});
      }
      files = files[0];
      const update = await dbClient.updateFile(files._id, {"isPublic": false});
      if (!update.acknowledged){
        res.status(404).json({"error": "Not found"}); // temp
      }
      res.status(200).json({...files, "isPublic": false});
    }catch (err){
      res.status(404).json({"error": "Not found"});
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
  const parentId = req.query.parentid || "0";
  const page = /\d+/.test(req.query.page || '')  ? Number.parseInt(req.query.page) : 0;

  const userId = req.userid;
  if (!userId){
    res.status(401).json({"error": "Unauthorized"});
  }
  (async ()=> {
    try{
      const files = await dbClient.findFile({ parentId }, {page, "limit": 20});
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
        res.status(404).json({"error": "Not found"});
      } else {
        files = await dbClient.findFile({"_id": id, "userId": userId});
      }
      if (!files){
        res.status(404).json({"error": "Not found"});
      }
      if (files.length != 1){
        res.status(404).json({"error": "Not found"});
      }
      files = files[0];
      const update = await dbClient.updateFile(files._id, {"isPublic": true});
      if (!update.acknowledged){
        res.status(404).json({"error": "Not found"}); // temp
      }
      res.status(200).json({...files, "isPublic": true});
    }catch (err){
      res.status(404).json({"error": "Not found"});
    }
  })();
}
/**
 * GET /files/:id/data
*/
export function getFile(req, res){
  const id = req.params.id;
  const userId = req.userid;
  const size = req.query.size || null;
  if (!userId){
    res.status(401).json({"error": "Unauthorized"});
  }
  let files;
  (async ()=> {
    let userId = null;
    const sessionToken = req.headers["x-token"];
    if (sessionToken){
        userId = await redisClient.get(`auth_${sessionToken}`);
    }
    try {
      /*
      if (!id){
        files = await dbClient.get({"_id": id, "userId": userId});
      } else {
        files = await dbClient.get({"_id": id, "userId": userId});
      }
        */
      files = await dbClient.get({"_id": id});
      if (!files){
        res.status(404).json({"error": "Not found"});
      }
      if (files.length != 1){
        res.status(404).json({"error": "Not found"});
      }
      let file = files[0];
      if (file.isPrivate === true && file.userId != id){
        res.status(404).json({"error": "Not found"});
      }
      if (file.type === "folder"){
        res.status(400).json({"error": "A folder doesn't have content"});
      }
      let path = file.localPath;
      if (size){
        path = `${path}_${size}`;
      }
      if (!fs.existSync(path)){
        res.status(404).json({"error": "Not found"});
      }
      res.setHeader('Content-Type', contentType(file.name) || 'text/plain; charset=utf-8');
      res.status(200).sendFile(path);
    }catch (err){
      res.status(404).json({"error": "Not found"});
    }
  })();
}


