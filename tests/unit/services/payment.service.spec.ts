import '../../setup'; // Import database setup for service tests that need database
import mongoose from 'mongoose';
import PaymentService from '../../../src/services/payment.service';
import Transaction, { TransactionType, TransactionStatus } from '../../../src/models/transaction.model';
import groupService from '../../../src/services/group.service';

// Import User model to ensure it's registered for population
import '../../../src/models/user.model';

jest.mock('../../../src/utils/paymentSimulator', () => ({
  simulatePayment: jest.fn(),
}));

import { simulatePayment } from '../../../src/utils/paymentSimulator';

describe('PaymentService', () => {
  afterEach(async () => {
    jest.clearAllMocks();
    await Transaction.deleteMany({});
  });

  describe('processPayment', () => {
    it('should create a completed payment transaction', async () => {
      const fakeTransactionId = 'tx123';
      (simulatePayment as jest.Mock).mockResolvedValue({ transactionId: fakeTransactionId });

      const paymentData = {
        group: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        amount: 100,
        type: TransactionType.CONTRIBUTION,
      };

      const transaction = await PaymentService.processPayment(paymentData as any);

      expect(transaction.status).toBe(TransactionStatus.COMPLETED);
      expect(transaction.reference).toBe(fakeTransactionId);
      expect(simulatePayment).toHaveBeenCalledWith({
        amount: 100,
        userId: paymentData.user.toString(),
      });
    });

    it('should set transaction to FAILED on payment error', async () => {
      (simulatePayment as jest.Mock).mockRejectedValue(new Error('Failed'));

      const paymentData = {
        group: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        amount: 100,
        type: TransactionType.CONTRIBUTION,
      };

      await expect(PaymentService.processPayment(paymentData as any)).rejects.toThrow('Payment processing failed');

      const tx = await Transaction.findOne({ user: paymentData.user });
      expect(tx?.status).toBe(TransactionStatus.FAILED);
    });
  });

  describe('processPayout', () => {
    it('should create a completed payout transaction', async () => {
      const fakeTransactionId = 'payout123';
      (simulatePayment as jest.Mock).mockResolvedValue({ transactionId: fakeTransactionId });

      jest.spyOn(groupService, 'getGroupById').mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        amount: 150,
      } as any);

      const payoutData = {
        group: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        type: TransactionType.PAYOUT,
        bankAccount: {
          accountNumber: '123456',
          bankName: 'Test Bank',
          accountHolder: 'John Doe',
        },
      };

      const transaction = await PaymentService.processPayout(payoutData as any);

      expect(transaction.status).toBe(TransactionStatus.COMPLETED);
      expect(transaction.amount).toBe(150);
      expect(transaction.reference).toBe(fakeTransactionId);
      expect(simulatePayment).toHaveBeenCalledWith({
        amount: 150,
        userId: payoutData.user.toString(),
        bankAccount: payoutData.bankAccount,
      });
    });
  });

  describe('getGroupPayments', () => {
    it('should return payments for the group', async () => {
      const groupId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();

      await Transaction.create({
        group: groupId,
        user: userId,
        amount: 100,
        status: TransactionStatus.COMPLETED,
        type: TransactionType.CONTRIBUTION,
      });

      const payments = await PaymentService.getGroupPayments(groupId);
      expect(payments.length).toBe(1);
      expect(payments[0].group.toString()).toBe(groupId.toString());
    });
  });
});
