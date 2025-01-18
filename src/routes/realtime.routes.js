import express from 'express';
import { RealtimeController } from '../controllers/realtime.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/subscribe', authMiddleware, RealtimeController.subscribe);
router.post('/unsubscribe', authMiddleware, RealtimeController.unsubscribe);
router.post('/broadcast', authMiddleware, RealtimeController.broadcast);
router.get('/status', authMiddleware, RealtimeController.getStatus);

export default router; 