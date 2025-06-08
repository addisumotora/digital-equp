import { Types } from 'mongoose';
import Transaction from '../models/transaction.model';
import {ApiError} from '../utils/apiError';
import { simulatePayment } from '../utils/paymentSimulator';
import { TransactionStatus, TransactionType } from '../models/transaction.model';


class PaymentService {
  async processPayment(paymentData: {
    group: Types.ObjectId;
    user: Types.ObjectId;
    amount: number;
    type: TransactionType;
  }) {
    const transaction = await Transaction.create({
      ...paymentData,
      status: TransactionStatus.PENDING
    });

    try {
      const paymentResult = await simulatePayment({
        amount: paymentData.amount,
        userId: paymentData.user.toString()
      });

      transaction.status = TransactionStatus.COMPLETED;
      transaction.reference = paymentResult.transactionId;
      transaction.processedAt = new Date();
      await transaction.save();

      return transaction;
    } catch (error) {
      transaction.status = TransactionStatus.FAILED;
      await transaction.save();
      throw new ApiError(400, 'Payment processing failed');
    }
  }

  async getGroupPayments(groupId: Types.ObjectId) {
    return Transaction.find({ group: groupId })
      .sort({ createdAt: -1 })
      .populate('user', 'username email');
  }
}

export default new PaymentService();