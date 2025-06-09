import jwt, { JwtPayload as DefaultJwtPayload } from "jsonwebtoken";
import { Request } from "express";

export interface RegisterRequest {
  body: {
    username: string;
    email: string;
    password: string;
  };
}

export interface LoginRequest {
  body: {
    email: string;
    password: string;
  };
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export interface JwtPayload extends DefaultJwtPayload {
  id: string;
  role: string;
}

export enum UserRole {
  SUPER_ADMIN = "super_admin",
  GROUP_ADMIN = "group_admin",
  MEMBER = "member",
}