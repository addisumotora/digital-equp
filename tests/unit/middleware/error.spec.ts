import { Request, Response, NextFunction } from 'express';
import { errorConverter, errorHandler, notFound, catchAsync } from '../../../src/middleware/error';
import { ApiError } from '../../../src/utils/apiError';

// Mock dependencies
jest.mock('../../../src/config/config', () => ({
  isProd: false,
  isDev: true
}));

jest.mock('../../../src/utils/logger', () => ({
  error: jest.fn()
}));

describe('Error Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      originalUrl: '/api/test'
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('errorConverter', () => {
    it('should convert generic Error to ApiError', () => {
      const genericError = new Error('Generic error');
      genericError.stack = 'error stack trace';

      errorConverter(genericError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      const convertedError = (mockNext as jest.Mock).mock.calls[0][0];
      expect(convertedError.statusCode).toBe(500);
      expect(convertedError.message).toBe('Generic error');
    });

    it('should convert error with custom statusCode', () => {
      const customError = new Error('Custom error') as any;
      customError.statusCode = 400;

      errorConverter(customError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      const convertedError = (mockNext as jest.Mock).mock.calls[0][0];
      expect(convertedError.statusCode).toBe(400);
      expect(convertedError.message).toBe('Custom error');
    });

    it('should pass through existing ApiError unchanged', () => {
      const apiError = new ApiError(404, 'Not found');

      errorConverter(apiError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(apiError);
    });

    it('should handle error without message', () => {
      const errorWithoutMessage = new Error();

      errorConverter(errorWithoutMessage, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      const convertedError = (mockNext as jest.Mock).mock.calls[0][0];
      expect(convertedError.message).toBe('Internal Server Error');
    });
  });

  describe('errorHandler', () => {
    it('should handle ApiError in development mode', () => {
      jest.doMock('../../../src/config/config', () => ({
        isDev: true,
        isProd: false
      }));
      
      const apiError = new ApiError(400, 'Bad request');
      apiError.stack = 'error stack trace';

      errorHandler(apiError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Bad request',
        stack: 'error stack trace'
      });
    });

    it('should handle ApiError in production mode', () => {
      jest.doMock('../../../src/config/config', () => ({
        isProd: true,
        isDev: false
      }));

      const apiError = new ApiError(400, 'Bad request');
      apiError.stack = 'error stack trace';

      errorHandler(apiError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Bad request'
        })
      );
    });

    it('should handle non-operational errors in production', () => {
      jest.doMock('../../../src/config/config', () => ({
        isProd: true,
        isDev: false
      }));

      const logger = require('../../../src/utils/logger');
      const apiError = new ApiError(500, 'Internal error', false);

      errorHandler(apiError, mockRequest as Request, mockResponse as Response, mockNext);

      // The logger may log the full error or just specific parts
      expect(logger.error).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Internal error'
        })
      );
    });

    it('should log stack trace in development', () => {
      jest.doMock('../../../src/config/config', () => ({
        isDev: true,
        isProd: false
      }));
      
      const logger = require('../../../src/utils/logger');
      const apiError = new ApiError(400, 'Bad request');
      apiError.stack = 'error stack trace';

      errorHandler(apiError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(logger.error).toHaveBeenCalledWith(apiError.stack);
    });
  });

  describe('notFound', () => {
    it('should create 404 error for unknown routes', () => {
      mockRequest.originalUrl = '/api/unknown-route';

      notFound(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: 'Not found - /api/unknown-route'
        })
      );
    });

    it('should handle request without originalUrl', () => {
      mockRequest.originalUrl = undefined;

      notFound(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: 'Not found - undefined'
        })
      );
    });
  });

  describe('catchAsync', () => {
    it('should catch async function errors and pass to next', async () => {
      const asyncFunction = jest.fn().mockRejectedValue(new Error('Async error'));
      const wrappedFunction = catchAsync(asyncFunction);

      await wrappedFunction(mockRequest as Request, mockResponse as Response, mockNext);

      expect(asyncFunction).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should pass through successful async functions', async () => {
      const asyncFunction = jest.fn().mockResolvedValue('success');
      const wrappedFunction = catchAsync(asyncFunction);

      await wrappedFunction(mockRequest as Request, mockResponse as Response, mockNext);

      expect(asyncFunction).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle synchronous errors in async wrapper', async () => {
      const syncErrorFunction = jest.fn().mockImplementation(() => {
        throw new Error('Sync error');
      });
      const wrappedFunction = catchAsync(syncErrorFunction);

      try {
        await wrappedFunction(mockRequest as Request, mockResponse as Response, mockNext);
      } catch (error) {
        // The error is caught by the wrapper
      }

      expect(syncErrorFunction).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should preserve function context and arguments', async () => {
      const testFunction = jest.fn().mockResolvedValue('test');
      const wrappedFunction = catchAsync(testFunction);

      const customReq = { custom: 'request' };
      const customRes = { custom: 'response' };
      const customNext = jest.fn();

      await wrappedFunction(customReq as unknown as Request, customRes as unknown as Response, customNext);

      expect(testFunction).toHaveBeenCalledWith(customReq, customRes, customNext);
    });
  });

  describe('error integration', () => {
    it('should work with errorConverter and errorHandler together', () => {
      const genericError = new Error('Test error');
      
      // First convert the error
      errorConverter(genericError, mockRequest as Request, mockResponse as Response, mockNext);
      
      const convertedError = (mockNext as jest.Mock).mock.calls[0][0];
      expect(convertedError).toBeInstanceOf(ApiError);
      
      // Reset mock
      (mockNext as jest.Mock).mockClear();
      
      // Then handle the converted error
      errorHandler(convertedError, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Test error',
        stack: expect.any(String)
      });
    });
  });
}); 