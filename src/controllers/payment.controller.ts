import { Response, NextFunction } from 'express';
import PaymentService from '../services/payment.service';
import GroupService from '../services/group.service';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { AuthenticatedRequest } from '../types/types';
import { TransactionType } from '../models/transaction.model';
import userModel from '../models/user.model';
import userService from '../services/user.service';

export default {
  async makePayment(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        throw new ApiError(401, 'Unauthorized');
      }
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
        type: TransactionType.CONTRIBUTION
      });

      return new ApiResponse(res, 200, payment, 'Payment processed successfully').send();
    } catch (err) {
      next(err);
    }
  },

async processPayout(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { groupId } = req.params;

    // Get the group and current winner
    const group = await GroupService.getGroupById(groupId);
    if (!group || !group.currentWinner) {
      throw new ApiError(404, 'No current winner for this group');
    }

    // Fetch winner's bank account info
    const winner = await userService.getUserById(group.currentWinner);
    if (!winner?.bankAccount) {
      throw new ApiError(400, 'Winner bank account information not found');
    }

    // Process payout to winner
    const payout = await PaymentService.processPayout({
      group: groupId,
      user: group.currentWinner,
      type: TransactionType.PAYOUT,
      bankAccount: winner.bankAccount
    });

    return new ApiResponse(res, 200, payout, 'Payout processed to winner\'s bank account successfully').send();
  } catch (err) {
    next(err);
  }
},
  async getPaymentHistory(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { groupId } = req.params;
      const payments = await PaymentService.getGroupPayments(groupId);
      return new ApiResponse(res, 200, payments).send();
    } catch (err) {
      next(err);
    }
  }
};