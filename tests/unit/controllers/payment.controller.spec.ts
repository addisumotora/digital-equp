import { Request, Response, NextFunction } from 'express';
import PaymentController from '../../../src/controllers/payment.controller';
import PaymentService from '../../../src/services/payment.service';
import GroupService from '../../../src/services/group.service';
import userService from '../../../src/services/user.service';
import { ApiError } from '../../../src/utils/apiError';
import { TransactionType } from '../../../src/models/transaction.model';
import { AuthenticatedRequest } from '../../../src/types/types';

// Mock dependencies
jest.mock('../../../src/services/payment.service');
jest.mock('../../../src/services/group.service');
jest.mock('../../../src/services/user.service');

const mockPaymentService = PaymentService as jest.Mocked<typeof PaymentService>;
const mockGroupService = GroupService as jest.Mocked<typeof GroupService>;
const mockUserService = userService as jest.Mocked<typeof userService>;

describe('PaymentController', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('makePayment', () => {
    it('should make payment successfully', async () => {
      const paymentData = {
        groupId: 'group123',
        amount: 1000
      };

      const mockPayment = {
        _id: 'payment123',
        user: 'user123',
        group: 'group123',
        amount: 1000,
        type: TransactionType.CONTRIBUTION,
        status: 'COMPLETED'
      };

      mockRequest.body = paymentData;
      mockRequest.user = { id: 'user123', role: 'member' };
      mockGroupService.isGroupMember.mockResolvedValue(true);
      mockPaymentService.processPayment.mockResolvedValue(mockPayment as any);

      await PaymentController.makePayment(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockGroupService.isGroupMember).toHaveBeenCalledWith('group123', 'user123');
      expect(mockPaymentService.processPayment).toHaveBeenCalledWith({
        group: 'group123',
        user: 'user123',
        amount: 1000,
        type: TransactionType.CONTRIBUTION
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle unauthorized user', async () => {
      mockRequest.body = { groupId: 'group123', amount: 1000 };
      mockRequest.user = undefined;

      await PaymentController.makePayment(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'Unauthorized'
        })
      );
    });

    it('should handle user not a group member', async () => {
      mockRequest.body = { groupId: 'group123', amount: 1000 };
      mockRequest.user = { id: 'user123', role: 'member' };
      mockGroupService.isGroupMember.mockResolvedValue(false);

      await PaymentController.makePayment(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: 'You are not a member of this group'
        })
      );
    });

    it('should handle payment processing error', async () => {
      const error = new Error('Payment failed');
      mockRequest.body = { groupId: 'group123', amount: 1000 };
      mockRequest.user = { id: 'user123', role: 'member' };
      mockGroupService.isGroupMember.mockResolvedValue(true);
      mockPaymentService.processPayment.mockRejectedValue(error);

      await PaymentController.makePayment(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('processPayout', () => {
    it('should process payout successfully', async () => {
      const mockGroup = {
        _id: 'group123',
        currentWinner: 'user456',
        amount: 5000
      };

      const mockWinner = {
        _id: 'user456',
        username: 'winner',
        bankAccount: {
          accountNumber: '1234567890',
          bankName: 'Test Bank',
          accountHolder: 'Winner User'
        }
      };

      const mockPayout = {
        _id: 'payout123',
        user: 'user456',
        group: 'group123',
        amount: 5000,
        type: TransactionType.PAYOUT,
        status: 'COMPLETED'
      };

      mockRequest.params = { groupId: 'group123' };
      mockGroupService.getGroupById.mockResolvedValue(mockGroup as any);
      mockUserService.getUserById.mockResolvedValue(mockWinner as any);
      mockPaymentService.processPayout.mockResolvedValue(mockPayout as any);

      await PaymentController.processPayout(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockGroupService.getGroupById).toHaveBeenCalledWith('group123');
      expect(mockUserService.getUserById).toHaveBeenCalledWith('user456');
      expect(mockPaymentService.processPayout).toHaveBeenCalledWith({
        group: 'group123',
        user: 'user456',
        type: TransactionType.PAYOUT,
        bankAccount: mockWinner.bankAccount
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle group not found', async () => {
      mockRequest.params = { groupId: 'nonexistent' };
      mockGroupService.getGroupById.mockResolvedValue(null);

      await PaymentController.processPayout(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: 'No current winner for this group'
        })
      );
    });

    it('should handle group with no current winner', async () => {
      const mockGroup = {
        _id: 'group123',
        currentWinner: null,
        amount: 5000
      };

      mockRequest.params = { groupId: 'group123' };
      mockGroupService.getGroupById.mockResolvedValue(mockGroup as any);

      await PaymentController.processPayout(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: 'No current winner for this group'
        })
      );
    });

    it('should process payout even without bank account', async () => {
      const mockGroup = {
        _id: 'group123',
        currentWinner: 'user456',
        amount: 5000
      };

      const mockWinner = {
        _id: 'user456',
        username: 'winner'
        // No bankAccount property
      };

      const mockPayout = {
        _id: 'payout123',
        user: 'user456',
        group: 'group123',
        amount: 5000,
        type: TransactionType.PAYOUT,
        status: 'COMPLETED'
      };

      mockRequest.params = { groupId: 'group123' };
      mockGroupService.getGroupById.mockResolvedValue(mockGroup as any);
      mockUserService.getUserById.mockResolvedValue(mockWinner as any);
      mockPaymentService.processPayout.mockResolvedValue(mockPayout as any);

      await PaymentController.processPayout(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockPaymentService.processPayout).toHaveBeenCalledWith({
        group: 'group123',
        user: 'user456',
        type: TransactionType.PAYOUT,
        bankAccount: undefined
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle payout processing error', async () => {
      const mockGroup = {
        _id: 'group123',
        currentWinner: 'user456',
        amount: 5000
      };

      const mockWinner = {
        _id: 'user456',
        username: 'winner'
      };

      const error = new Error('Payout failed');
      mockRequest.params = { groupId: 'group123' };
      mockGroupService.getGroupById.mockResolvedValue(mockGroup as any);
      mockUserService.getUserById.mockResolvedValue(mockWinner as any);
      mockPaymentService.processPayout.mockRejectedValue(error);

      await PaymentController.processPayout(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getPaymentHistory', () => {
    it('should get payment history successfully', async () => {
      const mockPayments = [
        {
          _id: 'payment1',
          user: 'user123',
          group: 'group123',
          amount: 1000,
          type: TransactionType.CONTRIBUTION
        },
        {
          _id: 'payment2',
          user: 'user456',
          group: 'group123',
          amount: 5000,
          type: TransactionType.PAYOUT
        }
      ];

      mockRequest.params = { groupId: 'group123' };
      mockPaymentService.getGroupPayments.mockResolvedValue(mockPayments as any);

      await PaymentController.getPaymentHistory(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockPaymentService.getGroupPayments).toHaveBeenCalledWith('group123');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle payment history error', async () => {
      const error = new Error('Database error');
      mockRequest.params = { groupId: 'group123' };
      mockPaymentService.getGroupPayments.mockRejectedValue(error);

      await PaymentController.getPaymentHistory(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
}); 