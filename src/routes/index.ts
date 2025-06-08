import { Router } from 'express';
import authRoutes from './auth.routes';
import groupRoutes from './group.routes';
import paymentRoutes from './payment.routes';
import { authenticate } from '../middleware/auth';

const router = Router();

// Auth routes (no authentication required)
router.use('/auth', authRoutes);

// Protected routes
router.use('/groups', authenticate, groupRoutes);
router.use('/payments', authenticate, paymentRoutes);

// 404 handler
router.use((_, res) => {
  res.status(404).json({ message: 'Not Found' });
});

export default router;