import { v4 as uuidv4 } from 'uuid';

export interface IPaymentResult {
  status: 'success' | 'failed';
  transactionId?: string;
  error?: string;
  timestamp: Date;
}

export const simulatePayment = async (
  paymentDetails: {
    amount: number;
    userId: string;
  },
  options?: {
    successRate?: number;
    delayMs?: number;
  }
): Promise<IPaymentResult> => {
  const successRate = options?.successRate ?? 0.9; // 90% success rate by default
  const delayMs = options?.delayMs ?? 1500; // 1.5s delay by default

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const isSuccess = Math.random() < successRate;

      if (isSuccess) {
        resolve({
          status: 'success',
          transactionId: `txn_${uuidv4()}`,
          timestamp: new Date()
        });
      } else {
        reject({
          status: 'failed',
          error: 'Payment processing failed due to insufficient funds',
          timestamp: new Date()
        });
      }
    }, delayMs);
  });
};

export const verifyPayment = async (
  transactionId: string
): Promise<IPaymentResult> => {
  return {
    status: 'success',
    transactionId,
    timestamp: new Date()
  };
};