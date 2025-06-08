import mongoose, { Document, Schema, Types } from 'mongoose';

export enum TransactionType {
  CONTRIBUTION = 'contribution',
  PAYOUT = 'payout',
  PENALTY = 'penalty'
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface ITransaction extends Document {
  user: Types.ObjectId;
  group: Types.ObjectId;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  reference?: string;
  description?: string;
  processedAt?: Date;
}

const TransactionSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  group: { type: Schema.Types.ObjectId, ref: 'EqubGroup', required: true },
  amount: { type: Number, required: true, min: 0 },
  type: { 
    type: String, 
    required: true, 
    enum: Object.values(TransactionType) 
  },
  status: { 
    type: String, 
    required: true, 
    enum: Object.values(TransactionStatus),
    default: TransactionStatus.PENDING
  },
  reference: { type: String },
  description: { type: String },
  processedAt: { type: Date }
}, {
  timestamps: true,
  versionKey: false
});

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);