import { simulatePayment, verifyPayment } from '../../../src/utils/paymentSimulator';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234')
}));

describe('PaymentSimulator', () => {
  describe('simulatePayment', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should resolve with success result when payment succeeds', async () => {
      // Mock Math.random to return a value that ensures success (< 0.9)
      jest.spyOn(Math, 'random').mockReturnValue(0.5);

      const paymentDetails = {
        amount: 100,
        userId: 'user123'
      };

      const result = await simulatePayment(paymentDetails);

      expect(result.status).toBe('success');
      expect(result.transactionId).toBe('txn_mock-uuid-1234');
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.bankAccount).toBeUndefined();
    });

    it('should include bank account in result when provided', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.5);

      const bankAccount = {
        accountNumber: '1234567890',
        bankName: 'Test Bank',
        accountHolder: 'John Doe'
      };

      const paymentDetails = {
        amount: 100,
        userId: 'user123',
        bankAccount
      };

      const result = await simulatePayment(paymentDetails);

      expect(result.status).toBe('success');
      expect(result.bankAccount).toEqual(bankAccount);
    });

    it('should reject with failure when payment fails', async () => {
      // Mock Math.random to return a value that ensures failure (>= 0.9)
      jest.spyOn(Math, 'random').mockReturnValue(0.95);

      const paymentDetails = {
        amount: 100,
        userId: 'user123'
      };

      await expect(simulatePayment(paymentDetails)).rejects.toEqual({
        status: 'failed',
        error: 'Payment processing failed due to insufficient funds',
        timestamp: expect.any(Date),
        bankAccount: undefined
      });
    });

    it('should use custom success rate when provided', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.7);

      const paymentDetails = {
        amount: 100,
        userId: 'user123'
      };

      const options = {
        successRate: 0.6 // 70% > 60%, so this should fail
      };

      await expect(simulatePayment(paymentDetails, options)).rejects.toEqual({
        status: 'failed',
        error: 'Payment processing failed due to insufficient funds',
        timestamp: expect.any(Date),
        bankAccount: undefined
      });
    });

    it('should use custom delay when provided', (done) => {
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
      const startTime = Date.now();

      const paymentDetails = {
        amount: 100,
        userId: 'user123'
      };

      const options = {
        delayMs: 100 // Custom delay of 100ms
      };

      simulatePayment(paymentDetails, options).then(() => {
        const endTime = Date.now();
        const elapsed = endTime - startTime;
        
        // Should be at least 100ms (allowing for some variance)
        expect(elapsed).toBeGreaterThanOrEqual(90);
        done();
      });
    });

    it('should use default success rate of 90%', async () => {
      // Test multiple calls to verify the success rate
      jest.spyOn(Math, 'random')
        .mockReturnValueOnce(0.85) // Success (< 0.9)
        .mockReturnValueOnce(0.95); // Failure (>= 0.9)

      const paymentDetails = {
        amount: 100,
        userId: 'user123'
      };

      // First call should succeed
      const result1 = await simulatePayment(paymentDetails);
      expect(result1.status).toBe('success');

      // Second call should fail
      await expect(simulatePayment(paymentDetails)).rejects.toMatchObject({
        status: 'failed'
      });
    });

    it('should use default delay of 1500ms', (done) => {
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
      const startTime = Date.now();

      const paymentDetails = {
        amount: 100,
        userId: 'user123'
      };

      simulatePayment(paymentDetails).then(() => {
        const endTime = Date.now();
        const elapsed = endTime - startTime;
        
        // Should be at least 1500ms (allowing for some variance)
        expect(elapsed).toBeGreaterThanOrEqual(1400);
        done();
      });
    });

    it('should include bank account in failure result when provided', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.95);

      const bankAccount = {
        accountNumber: '9876543210',
        bankName: 'Failed Bank',
        accountHolder: 'Jane Doe'
      };

      const paymentDetails = {
        amount: 100,
        userId: 'user123',
        bankAccount
      };

      await expect(simulatePayment(paymentDetails)).rejects.toEqual({
        status: 'failed',
        error: 'Payment processing failed due to insufficient funds',
        timestamp: expect.any(Date),
        bankAccount
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });
  });

  describe('verifyPayment', () => {
    it('should return success result with provided transaction ID', async () => {
      const transactionId = 'txn_12345';
      
      const result = await verifyPayment(transactionId);

      expect(result.status).toBe('success');
      expect(result.transactionId).toBe(transactionId);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should handle different transaction ID formats', async () => {
      const transactionIds = [
        'txn_abc123',
        'payment_xyz789',
        '12345',
        'test-transaction-id'
      ];

      for (const txnId of transactionIds) {
        const result = await verifyPayment(txnId);
        expect(result.transactionId).toBe(txnId);
        expect(result.status).toBe('success');
      }
    });
  });
});
