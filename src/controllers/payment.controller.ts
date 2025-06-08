import PaymentService from '../services/payment.service';
import GroupService from '../services/group.service';
import ApiResponse from '../utils/apiResponse';
import ApiError from '../utils/apiError';
import { Request, Response, NextFunction } from 'express';

export default {
  async makePayment(req: Request, res:Response, next: NextFunction) {
    try {
      const { groupId, amount } = req.body;
      const userId = req.user.id;

      // Verify user is group member
      const isMember = await GroupService.isGroupMember(groupId, userId);
      if (!isMember) {
        throw new ApiError(403, 'You are not a member of this group');
      }

      // Process payment
      const payment = await PaymentService.processPayment({
        group: groupId,
        user: userId,
        amount,
        type: 'contribution'
      });

      new ApiResponse(res, 200, payment, 'Payment processed successfully').send();
    } catch (err) {
      next(err);
    }
  },

  async processPayout(req: Request, res:Response, next: NextFunction) {
    try {
      const { groupId } = req.params;
      const userId = req.user.id;

      // Verify user is the current winner
      const isWinner = await GroupService.isCurrentWinner(groupId, userId);
      if (!isWinner) {
        throw new ApiError(403, 'You are not the current payout recipient');
      }

      // Process payout
      const payout = await PaymentService.processPayout({
        group: groupId,
        user: userId,
        type: 'payout'
      });

      new ApiResponse(res, 200, payout, 'Payout processed successfully').send();
    } catch (err) {
      next(err);
    }
  },

  async getPaymentHistory(req: Request, res:Response, next: NextFunction) {
    try {
      const { groupId } = req.params;
      const payments = await PaymentService.getGroupPayments(groupId);
      new ApiResponse(res, 200, payments).send();
    } catch (err) {
      next(err);
    }
  }
};