import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false }
}, {
  timestamps: true,
  versionKey: false
});

UserSchema.pre<IUser>('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = async function(
  candidatePassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);