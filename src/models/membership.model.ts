import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMembership extends Document {
  user: Types.ObjectId;
  group: Types.ObjectId;
  joinDate: Date;
  isActive: boolean;
  totalPaid: number;
  totalReceived: number;
}

const MembershipSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  group: { type: Schema.Types.ObjectId, ref: 'EqubGroup', required: true },
  joinDate: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  totalPaid: { type: Number, default: 0 },
  totalReceived: { type: Number, default: 0 }
}, {
  timestamps: true,
  versionKey: false
});

MembershipSchema.index({ user: 1, group: 1 }, { unique: true });

export default mongoose.model<IMembership>('Membership', MembershipSchema);