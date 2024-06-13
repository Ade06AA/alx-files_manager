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
  const parentId = req.body.parentId ||"0";
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
  try{
    (async ()=>{
      const userId = req.userid;
      if (!userId){
        res.status(401).json({"error": "Unauthorized"});
        return
      }
      if (parentId != 0){
        parentFile = await dbClient.findFile({"_id": parentId});
        if (parentFile.length != 1){
          res.status(400).json({"error": "Parent not found"});
          return
        }
        parentFile = parentFile[0];
        if (parentFile.type != 'folder'){
          res.status(400).json({"error": "Parent is not a folder"});
          return
        }
      }
      if (type === "folder"){
        const _id = await dbClient.addFile({
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
        const relative_path = process.env.FOLDER_PATH || joinPath(tmpdir(), "files_manager");
        const file_name = uuidv4();
        const localPath = joinPath(relative_path, file_name);
        fs.mkdirSync(relative_path, {recursive: true});
        //data = Buffer.from(data, 'base64');
        fs.writeFileSync(localPath, data, {'encoding': 'base64'});
        const _id = await dbClient.addFile({
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
        console.log("type", type)
        res.status(201).json({'id': _id, userId, name, type, isPublic, parentId});
      }
    })();
    }catch (err) {
      console.log(err)
      res.status(500).end()
    }
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
        // to be removed not nessesry
        files = await dbClient.findFile({"userId": userId});
      } else {
        files = await dbClient.findFile({"_id": id, "userId": userId});
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
        files = await dbClient.findFile({"_id": id, "userId": userId});
        console.log("dddddddd")
      }
      if (!files){
        res.status(404).json({"error": "Not found"});
        return
      }
      if (files.length != 1){
        res.status(404).json({"error": "Not found"});
        return
      }
      files = files[0];
      const update = await dbClient.updateFile(files._id, {"isPublic": false});
      if (update.matchedCount != 1){
        res.status(404).json({"error": "Not found"}); // temp
        return
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
  const parentId = req.query.parentId || null;
  const page = /\d+/.test(req.query.page || '')  ? Number.parseInt(req.query.page) : 0;

  const userId = req.userid;
  if (!userId){
    res.status(401).json({"error": "Unauthorized  userid"});
  }
  (async ()=> {
    try{
      console.log(99999)
      //const files = await dbClient.findFile({ parentId }, {page, "limit": 20});
      let files
      if (parentId){
        files = await dbClient.findFile({ parentId }, {page, "limit": "20"});
      } else {
        files = await dbClient.findFile({ }, {page, "limit": "20"});
      }
      res.status(200).json(files);
    } catch (err){
      console.log(err);
      res.status(401).json({"error": "Unauthorized    pag"}); //temp
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
        return
      } else {
        files = await dbClient.findFile({"_id": id, "userId": userId});
      }
      if (!files){
        res.status(404).json({"error": "Not found"});
        return
      }
      if (files.length != 1){
        res.status(404).json({"error": "Not found"});
        return
      }
      files = files[0];
      const update = await dbClient.updateFile(files._id, {"isPublic": true});
      console.log("f2rf2i", update)
      if (update.matchedCount != 1){
        res.status(404).json({"error": "Not found"}); // temp
        return
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
    console.log("data", id, userId, size)
  let files;
  (async ()=> {
    console.log("data", id, userId, size)
    try {
      /*
      if (!id){
        // to be removed
        files = await dbClient.get({"_id": id, "userId": userId});
      } else {
    console.log("data", id, userId, size)
        files = await dbClient.get({"_id": id, "userId": userId});
      }
        */
    console.log("data", id, userId, size)
      files = await dbClient.findFile({"_id": id});
    console.log("data", id, userId, files)
      if (!files){
        res.status(404).json({"error": "Not found"});
        return
      }
      if (files.length != 1){
        res.status(404).json({"error": "Not found"});
        return
      }
      let file = files[0];
      if (file.isPrivate === true && file.userId != id){
        res.status(404).json({"error": "Not found"});
        return
      }
      if (file.type === "folder"){
        res.status(400).json({"error": "A folder doesn't have content"});
        return
      }
      let path = file.localPath;
      if (size){
        path = `${path}_${size}`;
      }
      if (!fs.existsSync(path)){
        res.status(404).json({"error": "iiNot found"});
        return
      }
      res.setHeader('Content-Type', contentType(file.name) || 'text/plain; charset=utf-8');
      res.status(200).sendFile(path);
    }catch (err){
      console.log(err)
      res.status(404).json({"error": "Not found"});
    }
  })();
}


