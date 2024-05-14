import express from 'express';
import { GetStatus, GetStats, getUser } from '../controllers/AppController';
import { getDisconnect, getConnect, getMe } from '../controllers/AuthController';

const router = express.Router();

router.get('/status', getStatus);
router.get('/stats', getStats);
router.post('/users', getUser);
GET /connect => AuthController.getConnect
GET /disconnect => AuthController.getDisconnect
GET /users/me => UserController.getMe
router.get('/connect', getConnect);
router.get('/disconnect', getDisconnect);
router.get('/users/me', getMe);
module.exports = router;
