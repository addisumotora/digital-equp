import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IEqubGroup extends Document {
  name: string;
  description?: string;
  creator: Types.ObjectId;
  amount: number;
  cycleDuration: number;
  currentCycle: number;
  currentWinner?: Types.ObjectId;
  isActive: boolean;
  startDate: Date;
  members: Types.ObjectId[];
}

const EqubGroupSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 1 },
  cycleDuration: { type: Number, required: true, min: 1 }, // in days
  currentCycle: { type: Number, default: 1 },
  currentWinner: { type: Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
  startDate: { type: Date, default: Date.now },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, {
  timestamps: true,
  versionKey: false
});

export default mongoose.model<IEqubGroup>('EqubGroup', EqubGroupSchema);