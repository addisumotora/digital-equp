import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import  env from '../config/config';
import logger from '../utils/logger';

export const errorConverter = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, false, err.stack);
  }
  next(error);
};

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { statusCode, message, isOperational } = err;

  if (env.isProd && !isOperational) {
    logger.error('UNHANDLED ERROR:', err);
  }

  if (env.isDev) {
    logger.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.isDev && { stack: err.stack })
  });
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  next(new ApiError(404, `Not found - ${req.originalUrl}`));
};

export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};