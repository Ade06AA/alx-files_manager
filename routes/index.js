import express from 'express';
import {
  GetStatus, GetStats, NewUser
} from '../controllers/AppController';

const router = express.Router();

router.get('/status', GetStatus);
router.get('/stats', GetStats);
router.post('/users', NewUser);

module.exports = router;
