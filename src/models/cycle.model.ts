import mongoose, { Document, Schema, Types } from 'mongoose';

export enum CycleStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PENDING = 'pending'
}

export interface ICycle extends Document {
  group: Types.ObjectId;
  cycleNumber: number;
  startDate: Date;
  endDate: Date;
  status: CycleStatus;
  winner?: Types.ObjectId;
  totalAmount: number;
}

const CycleSchema: Schema = new Schema({
  group: { type: Schema.Types.ObjectId, ref: 'EqubGroup', required: true },
  cycleNumber: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { 
    type: String, 
    required: true, 
    enum: Object.values(CycleStatus),
    default: CycleStatus.PENDING
  },
  winner: { type: Schema.Types.ObjectId, ref: 'User' },
  totalAmount: { type: Number, default: 0 }
}, {
  timestamps: true,
  versionKey: false
});

CycleSchema.index({ group: 1, status: 1 });

export default mongoose.model<ICycle>('Cycle', CycleSchema);