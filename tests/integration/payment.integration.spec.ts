import '../setup'; // Import database setup for integration tests
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import paymentRoutes from '../../src/routes/payment.routes';
import authRoutes from '../../src/routes/auth.routes';
import groupRoutes from '../../src/routes/group.routes';
import { errorHandler, errorConverter, notFound } from '../../src/middleware/error';
import { authenticate } from '../../src/middleware/auth';
import User from '../../src/models/user.model';
import EqubGroup from '../../src/models/group.model';
import Membership from '../../src/models/membership.model';
import Transaction, { TransactionType, TransactionStatus } from '../../src/models/transaction.model';
import { UserRole } from '../../src/types/types';

// Mock the payment simulator
jest.mock('../../src/utils/paymentSimulator', () => ({
  simulatePayment: jest.fn()
}));

import { simulatePayment } from '../../src/utils/paymentSimulator';

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/groups', authenticate, groupRoutes);
  app.use('/api/v1/payments', authenticate, paymentRoutes);
  app.use(notFound);
  app.use(errorConverter);
  app.use(errorHandler);
  return app;
};

describe('Payment Integration Tests', () => {
  let app: express.Application;
  let memberToken: string;
  let groupAdminToken: string;
  let superAdminToken: string;
  let memberId: string;
  let groupAdminId: string;
  let superAdminId: string;
  let groupId: string;
  let winnerId: string;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await EqubGroup.deleteMany({});
    await Membership.deleteMany({});
    await Transaction.deleteMany({});

    // Mock payment simulator to always succeed
    (simulatePayment as jest.Mock).mockResolvedValue({
      transactionId: 'mock-txn-123',
      status: 'success',
      timestamp: new Date()
    });

    // Create member user
    const memberData = {
      username: 'member',
      email: 'member@example.com',
      password: 'Password123!',
      passwordConfirm: 'Password123!'
    };

    const memberResponse = await request(app)
      .post('/api/v1/auth/register')
      .send(memberData);

    memberToken = memberResponse.body.data.token;
    memberId = memberResponse.body.data.user._id;

    // Create group admin user
    const groupAdminData = {
      username: 'groupadmin',
      email: 'groupadmin@example.com',
      password: 'Password123!',
      passwordConfirm: 'Password123!'
    };

    const groupAdminResponse = await request(app)
      .post('/api/v1/auth/register')
      .send(groupAdminData);

    groupAdminId = groupAdminResponse.body.data.user._id;

    // Set group admin role
    await User.findByIdAndUpdate(groupAdminId, { role: [UserRole.GROUP_ADMIN] });

    // Login again to get token with updated role
    const groupAdminLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'groupadmin@example.com',
        password: 'Password123!'
      });

    groupAdminToken = groupAdminLoginResponse.body.data.token;

    // Create super admin user
    const superAdminData = {
      username: 'superadmin',
      email: 'superadmin@example.com',
      password: 'Password123!',
      passwordConfirm: 'Password123!'
    };

    const superAdminResponse = await request(app)
      .post('/api/v1/auth/register')
      .send(superAdminData);

    superAdminId = superAdminResponse.body.data.user._id;

    // Set super admin role
    await User.findByIdAndUpdate(superAdminId, { role: [UserRole.SUPER_ADMIN] });

    // Login again to get token with updated role
    const superAdminLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'superadmin@example.com',
        password: 'Password123!'
      });

    superAdminToken = superAdminLoginResponse.body.data.token;

    // Create test group
    const group = await EqubGroup.create({
      name: 'Test Payment Group',
      creator: superAdminId,
      amount: 1000,
      cycleDuration: 30,
      members: [superAdminId, memberId, groupAdminId],
      admin: groupAdminId,
      currentWinner: memberId
    });
    groupId = (group._id as any).toString();
    winnerId = memberId;

    // Create memberships
    await Membership.create([
      { user: superAdminId, group: groupId },
      { user: memberId, group: groupId },
      { user: groupAdminId, group: groupId }
    ]);

    // Update member with bank account info
    await User.findByIdAndUpdate(memberId, {
      bankAccount: {
        accountNumber: '1234567890',
        bankName: 'Test Bank',
        accountHolder: 'Test Member'
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/payments', () => {
    it('should allow group member to make payment', async () => {
      const paymentData = {
        groupId: groupId,
        amount: 1000
      };

      const response = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${memberToken}`)
        .send(paymentData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBe(memberId);
      expect(response.body.data.group).toBe(groupId);
      expect(response.body.data.amount).toBe(1000);
      expect(response.body.data.type).toBe(TransactionType.CONTRIBUTION);
      expect(response.body.data.status).toBe(TransactionStatus.COMPLETED);
      expect(response.body.message).toBe('Payment processed successfully');

      // Verify payment simulator was called
      expect(simulatePayment).toHaveBeenCalledWith({
        amount: 1000,
        userId: memberId
      });

      // Verify transaction was created in database
      const transaction = await Transaction.findOne({
        user: memberId,
        group: groupId,
        type: TransactionType.CONTRIBUTION
      });
      expect(transaction).not.toBeNull();
      expect(transaction?.amount).toBe(1000);
      expect(transaction?.status).toBe(TransactionStatus.COMPLETED);
    });

    it('should not allow non-member to make payment', async () => {
      // Create a non-member user
      const nonMemberData = {
        username: 'nonmember',
        email: 'nonmember@example.com',
        password: 'Password123!',
        passwordConfirm: 'Password123!'
      };

      const nonMemberResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(nonMemberData);

      const nonMemberToken = nonMemberResponse.body.data.token;

      const paymentData = {
        groupId: groupId,
        amount: 1000
      };

      const response = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${nonMemberToken}`)
        .send(paymentData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('You are not a member of this group');
    });

    it('should validate payment data', async () => {
      const invalidPaymentData = {
        groupId: 'invalid-id',
        amount: -100 // Invalid amount
      };

      const response = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${memberToken}`)
        .send(invalidPaymentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation error');
    });

    it('should handle payment processing failure', async () => {
      // Mock payment simulator to fail
      (simulatePayment as jest.Mock).mockRejectedValue(new Error('Payment failed'));

      const paymentData = {
        groupId: groupId,
        amount: 1000
      };

      const response = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${memberToken}`)
        .send(paymentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Payment processing failed');

      // Verify failed transaction was created
      const transaction = await Transaction.findOne({
        user: memberId,
        group: groupId,
        type: TransactionType.CONTRIBUTION
      });
      expect(transaction).not.toBeNull();
      expect(transaction?.status).toBe(TransactionStatus.FAILED);
    });

    it('should not allow payment for non-existent group', async () => {
      const nonExistentGroupId = new mongoose.Types.ObjectId();
      const paymentData = {
        groupId: nonExistentGroupId.toString(),
        amount: 1000
      };

      const response = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${memberToken}`)
        .send(paymentData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('You are not a member of this group');
    });
  });

  describe('POST /api/v1/payments/:groupId/payout', () => {
    it('should allow group admin to process payout', async () => {
      const response = await request(app)
        .post(`/api/v1/payments/${groupId}/payout`)
        .set('Authorization', `Bearer ${groupAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBe(winnerId);
      expect(response.body.data.group).toBe(groupId);
      expect(response.body.data.amount).toBe(1000); // Group amount
      expect(response.body.data.type).toBe(TransactionType.PAYOUT);
      expect(response.body.data.status).toBe(TransactionStatus.COMPLETED);
      expect(response.body.message).toBe("Payout processed to winner's bank account successfully");

      // Verify payout transaction was created
      const transaction = await Transaction.findOne({
        user: winnerId,
        group: groupId,
        type: TransactionType.PAYOUT
      });
      expect(transaction).not.toBeNull();
      expect(transaction?.amount).toBe(1000);
      expect(transaction?.status).toBe(TransactionStatus.COMPLETED);

      // Verify payment simulator was called with bank account
      expect(simulatePayment).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 1000,
          userId: winnerId,
          bankAccount: expect.objectContaining({
            accountNumber: '1234567890',
            bankName: 'Test Bank',
            accountHolder: 'Test Member'
          })
        })
      );
    });

    it('should allow super admin to process payout', async () => {
      const response = await request(app)
        .post(`/api/v1/payments/${groupId}/payout`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe(TransactionType.PAYOUT);
    });

    it('should not allow member to process payout', async () => {
      const response = await request(app)
        .post(`/api/v1/payments/${groupId}/payout`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });

    it('should handle group with no current winner', async () => {
      // Update group to have no current winner
      await EqubGroup.findByIdAndUpdate(groupId, { currentWinner: null });

      const response = await request(app)
        .post(`/api/v1/payments/${groupId}/payout`)
        .set('Authorization', `Bearer ${groupAdminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No current winner for this group');
    });

    it('should handle non-existent group', async () => {
      const nonExistentGroupId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post(`/api/v1/payments/${nonExistentGroupId}/payout`)
        .set('Authorization', `Bearer ${groupAdminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No current winner for this group');
    });

    it('should process payout even if winner has no bank account', async () => {
      // Remove bank account from winner
      await User.findByIdAndUpdate(winnerId, { $unset: { bankAccount: 1 } });

      const response = await request(app)
        .post(`/api/v1/payments/${groupId}/payout`)
        .set('Authorization', `Bearer ${groupAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify payment simulator was called without bank account
      expect(simulatePayment).toHaveBeenCalledWith({
        amount: 1000,
        userId: winnerId,
        bankAccount: undefined
      });
    });

    it('should handle payout processing failure', async () => {
      // Mock payment simulator to fail
      (simulatePayment as jest.Mock).mockRejectedValue(new Error('Payout failed'));

      const response = await request(app)
        .post(`/api/v1/payments/${groupId}/payout`)
        .set('Authorization', `Bearer ${groupAdminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Payout processing failed');

      // Verify failed payout transaction was created
      const transaction = await Transaction.findOne({
        user: winnerId,
        group: groupId,
        type: TransactionType.PAYOUT
      });
      expect(transaction).not.toBeNull();
      expect(transaction?.status).toBe(TransactionStatus.FAILED);
    });
  });

  describe('GET /api/v1/payments/:groupId/history', () => {
    beforeEach(async () => {
      // Create some test transactions
      await Transaction.create([
        {
          user: memberId,
          group: groupId,
          amount: 1000,
          type: TransactionType.CONTRIBUTION,
          status: TransactionStatus.COMPLETED,
          reference: 'txn-001',
          createdAt: new Date('2023-01-01')
        },
        {
          user: groupAdminId,
          group: groupId,
          amount: 1000,
          type: TransactionType.CONTRIBUTION,
          status: TransactionStatus.COMPLETED,
          reference: 'txn-002',
          createdAt: new Date('2023-01-02')
        },
        {
          user: winnerId,
          group: groupId,
          amount: 2000,
          type: TransactionType.PAYOUT,
          status: TransactionStatus.COMPLETED,
          reference: 'payout-001',
          createdAt: new Date('2023-01-03')
        }
      ]);
    });

    it('should allow group admin to get payment history', async () => {
      const response = await request(app)
        .get(`/api/v1/payments/${groupId}/history`)
        .set('Authorization', `Bearer ${groupAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(3);

      // Should be sorted by createdAt descending (most recent first)
      expect(response.body.data[0].reference).toBe('payout-001');
      expect(response.body.data[1].reference).toBe('txn-002');
      expect(response.body.data[2].reference).toBe('txn-001');

      // Should populate user information
      expect(response.body.data[0].user).toHaveProperty('username');
      expect(response.body.data[0].user).toHaveProperty('email');
    });

    it('should not allow member to get payment history', async () => {
      const response = await request(app)
        .get(`/api/v1/payments/${groupId}/history`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });

    it('should return empty array for group with no transactions', async () => {
      // Create a new group with no transactions
      const newGroup = await EqubGroup.create({
        name: 'Empty Group',
        creator: superAdminId,
        amount: 500,
        cycleDuration: 30,
        members: [superAdminId],
        admin: superAdminId
      });

      const response = await request(app)
        .get(`/api/v1/payments/${newGroup._id}/history`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should handle non-existent group', async () => {
      const nonExistentGroupId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/v1/payments/${nonExistentGroupId}/history`)
        .set('Authorization', `Bearer ${groupAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for all routes', async () => {
      const routes = [
        { method: 'post' as const, path: '/api/v1/payments' },
        { method: 'post' as const, path: `/api/v1/payments/${groupId}/payout` },
        { method: 'get' as const, path: `/api/v1/payments/${groupId}/history` }
      ];

      for (const route of routes) {
        const response = await (request(app) as any)[route.method](route.path).expect(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Authentication required');
      }
    });

    it('should reject invalid tokens', async () => {
      const response = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', 'Bearer invalid-token')
        .send({ groupId, amount: 1000 })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired token');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing payment data', async () => {
      const response = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({}) // Empty body
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation error');
    });

    it('should handle invalid ObjectId formats', async () => {
      const response = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          groupId: 'invalid-object-id',
          amount: 1000
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation error');
    });

    it('should handle concurrent payment processing', async () => {
      const paymentData = {
        groupId: groupId,
        amount: 1000
      };

      // Make multiple concurrent payment requests
      const promises = Array(3).fill(null).map(() =>
        request(app)
          .post('/api/v1/payments')
          .set('Authorization', `Bearer ${memberToken}`)
          .send(paymentData)
      );

      const responses = await Promise.all(promises);

      // All should succeed (if properly implemented)
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // Verify all transactions were created
      const transactions = await Transaction.find({
        user: memberId,
        group: groupId,
        type: TransactionType.CONTRIBUTION
      });
      expect(transactions.length).toBe(3);
    });
  });
}); 