import { Response } from 'express';
import env from '../config/config';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true,
    public stack: string = ''
  ) {
    super(message);
    if (stack) {
      this.stack = stack;
    } else if (env.isDev) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static handle(error: ApiError | Error, res: Response): void {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        ...(env.isDev && { stack: error.stack })
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        ...(env.isDev && { stack: error.stack })
      });
    }
  }
}

export const errorConverter = (err: any, req: any, res: any, next: any) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, false, err.stack);
  }
  next(error);
};

export const errorHandler = (err: ApiError, req: any, res: any, next: any) => {
  ApiError.handle(err, res);
};