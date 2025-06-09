import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcrypt";
import { UserRole } from "../types/types";

export interface BankAccount {
  accountNumber: string;
  bankName: string;
  accountHolder: string;
}

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: UserRole[];
  bankAccount?: BankAccount; 
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const BankAccountSchema: Schema = new Schema(
  {
    accountNumber: { type: String, required: true },
    bankName: { type: String, required: true },
    accountHolder: { type: String, required: true }
  },
  { _id: false }
);

const UserSchema: Schema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    role: {
      type: [String],
      enum: ["super_admin", "group_admin", "member"],
      default: ["member"],
    },
    bankAccount: { type: BankAccountSchema, required: false }, 
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

UserSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>("User", UserSchema);