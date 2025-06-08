import { Router } from 'express';
import PaymentController from '../controllers/payment.controller';

import { 
  makePaymentSchema
} from '../validations/payment.validation';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all payment routes
router.use(authenticate);

router.post(
  '/',
  validate(makePaymentSchema),
  PaymentController.makePayment
);

router.post(
  '/:groupId/payout',
  PaymentController.processPayout
);

router.get(
  '/:groupId/history',
  PaymentController.getPaymentHistory
);

export default router;