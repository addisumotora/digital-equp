import jwt, { JwtPayload as DefaultJwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import {ApiError} from '../utils/apiError';
import { AuthenticatedRequest, JwtPayload } from '../types/types';
import config from '../config/config';


const extractToken = (req: Request): string | null => {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.replace('Bearer ', '');
};

export const authenticate: RequestHandler = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) return next(new ApiError(401, 'Authentication required'));

  try {
    const secret = config.jwt.secret;
    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return next(new ApiError(401, 'Invalid or expired token'));
  }
};

export const authorize = (...roles: string[]): RequestHandler => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(403, 'Access denied: not authenticated'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, `Access denied: requires role(s) ${roles.join(', ')}`));
    }

    next();
  };
};
