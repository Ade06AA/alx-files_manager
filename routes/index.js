import express from 'express';
import { getStatus, getStats, getUser } from '../controllers/AppController';
import { getDisconnect, getConnect, getMe } from '../controllers/AuthController';

const router = express.Router();

router.get('/status', getStatus);
router.get('/stats', getStats);
router.post('/users', getUser);
router.get('/connect', getConnect);
router.get('/disconnect', getDisconnect);
router.get('/users/me', getMe);
module.exports = router;
