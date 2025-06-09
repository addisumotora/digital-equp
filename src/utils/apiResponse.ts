import { Response } from 'express';

export class ApiResponse<T> {
  constructor(
    private res: Response,
    public statusCode: number,
    public data: T | null = null,
    public message: string = 'Success',
    public meta?: {
      page?: number;
      limit?: number;
      total?: number;
    }
  ) {}

  public send() {
    this.res.status(this.statusCode).json({
      success: this.statusCode < 400,
      message: this.message,
      data: this.data,
      ...(this.meta && { meta: this.meta })
    });
  }

  static success<T>(res: Response, data: T, message?: string) {
    return new ApiResponse(res, 200, data, message);
  }

  static created<T>(res: Response, data: T, message?: string) {
    return new ApiResponse(res, 201, data, message);
  }
}