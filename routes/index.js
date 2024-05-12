import express from 'express';
import { GetStatus, GetStats } from '/controllers/AppController';

const router = express.Router();

router.get('/status', GetStatus);
router.get('/stats', GetStats);

module.exports = router;
