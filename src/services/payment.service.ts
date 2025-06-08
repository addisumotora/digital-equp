import { Types } from 'mongoose';
import Transaction from '../models/transaction.model';
import { ApiError } from '../utils/apiError';
import { simulatePayment } from '../utils/paymentSimulator';
import { TransactionStatus, TransactionType } from '../models/transaction.model';

class PaymentService {
  async processPayment(paymentData: {
    group: Types.ObjectId | string;
    user: Types.ObjectId | string;
    amount: number;
    type: TransactionType;
  }) {
    // Ensure group and user are ObjectIds
    const groupId = new Types.ObjectId(paymentData.group);
    const userId = new Types.ObjectId(paymentData.user);

    const transaction = await Transaction.create({
      ...paymentData,
      group: groupId,
      user: userId,
      status: TransactionStatus.PENDING
    });

    try {
      const paymentResult = await simulatePayment({
        amount: paymentData.amount,
        userId: userId.toString()
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

  async processPayout(payoutData: {
    group: Types.ObjectId | string;
    user: Types.ObjectId | string;
    type: TransactionType;
  }) {
    // Ensure group and user are ObjectIds
    const groupId = new Types.ObjectId(payoutData.group);
    const userId = new Types.ObjectId(payoutData.user);

    const transaction = await Transaction.create({
      ...payoutData,
      group: groupId,
      user: userId,
      status: TransactionStatus.PENDING
    });

    try {
      // Simulate payout (could be replaced with real payout logic)
      const payoutResult = await simulatePayment({
        amount: 0, // Set payout amount if needed
        userId: userId.toString()
      });

      transaction.status = TransactionStatus.COMPLETED;
      transaction.reference = payoutResult.transactionId;
      transaction.processedAt = new Date();
      await transaction.save();

      return transaction;
    } catch (error) {
      transaction.status = TransactionStatus.FAILED;
      await transaction.save();
      throw new ApiError(400, 'Payout processing failed');
    }
  }

  async getGroupPayments(groupId: Types.ObjectId | string) {
    const id = new Types.ObjectId(groupId);
    return Transaction.find({ group: id })
      .sort({ createdAt: -1 })
      .populate('user', 'username email');
  }
}

export default new PaymentService();