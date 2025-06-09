import jwt from "jsonwebtoken";
import { IUser } from "../models/user.model";
import config from "../config/config";

export function generateToken(user: IUser): string {
  const payload = {
    id: user._id,
    email: user.email,
    username: user.username,
    role: user.role
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}