import express from 'express';
import { getStatus, getStats, getUser } from '../controllers/AppController';
import { getDisconnect, getConnect, getMe } from '../controllers/AuthController';
import { postUpload, getShow, getIndex, putPublish, putUnpublish, getFile} from '../controllers/FilesController';

const router = express.Router();


router.get('/status', getStatus);

router.get('/stats', getStats);

/**
 * required:
 *   email: user email
 *   password: user password
**/
router.post('/users', getUser);//postNew

router.get('/connect', getConnect);

router.get('/disconnect', getDisconnect);

router.get('/users/me', getMe);

/**
 * required:
 *   name - as filename
 *   type - file type (file or image or folder)
 *   data - file or image data in base64
 * optional:
 *   parentId - id of parent (default: 0)
 *   isPublic - file is public or not (default: false)
 */
router.post('/files', postUpload);

router.get('/files/:id', getShow);
router.get('/files', getIndex);
router.put("/files/:id/publish", putPublish);
router.put("/files/:id/unpublish", putUnpublish);
router.get("/files/:id/data", getFile);

module.exports = router;
