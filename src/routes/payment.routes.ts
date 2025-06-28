import { Router } from 'express';
import PaymentController from '../controllers/payment.controller';
import { paymentSchema, payoutSchema } from '../validations/payment.validation';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();


router.use(authenticate);

router.post('/', validate(paymentSchema), PaymentController.makePayment);

router.post('/:groupId/payout', authorize('group_admin', 'super_admin'), validate(payoutSchema), PaymentController.processPayout);

router.get('/:groupId/history', authorize('group_admin', 'super_admin'), PaymentController.getPaymentHistory);

export default router;