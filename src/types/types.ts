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

export interface UserType {
  id: string;
  username: string;
  email: string;
}

export interface JwtPayload extends DefaultJwtPayload {
  id: string;
  role: string;
}