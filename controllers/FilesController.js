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
  const sessionToken = req.headers["x-token"];
  const name = req.body.name;
  const acceptedType = ["file", "folder", "image"];
  const type = req.body.type;
  const data = req.body.data;
  const parentId = req.body.parentid || 0;
  const isPublic = (req.body.ispublic === "true") ? true : false;
  if (!sessionToken){
    res.status(401).json({"error": "Unauthorized"});
  }
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
    try {
      userId = await redisClient.get(`auth_${sessionToken}`);
      if (!userId){
        res.status(401).json({"error": "Unauthorized"});
      }
    } catch (error) {
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
}
