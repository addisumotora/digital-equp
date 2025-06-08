import jwt, { JwtPayload as DefaultJwtPayload } from 'jsonwebtoken';
import { Request } from 'express';

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
  MEMBER = 'member',
  ADMIN = 'admin',
  GROUP_OWNER = 'group_owner'
}