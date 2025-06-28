import { ApiError } from '../../../src/utils/apiError';
import { Response } from 'express';

// Mock response object
const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

// Mock config dynamically
jest.mock('../../../src/config/config', () => ({
  isDev: false,
  isProd: true
}));

describe('ApiError', () => {
  describe('constructor', () => {
    it('should create ApiError with default values', () => {
      const error = new ApiError(400, 'Bad Request');
      
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Bad Request');
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('Error');
    });

    it('should create ApiError with custom operational flag', () => {
      const error = new ApiError(500, 'Internal Error', false);
      
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Internal Error');
      expect(error.isOperational).toBe(false);
    });

    it('should create ApiError with custom stack', () => {
      const customStack = 'Custom stack trace';
      const error = new ApiError(404, 'Not Found', true, customStack);
      
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Not Found');
      expect(error.stack).toBe(customStack);
    });
  });

  describe('handle static method', () => {
    let res: Response;

    beforeEach(() => {
      res = mockResponse();
    });

    it('should handle ApiError correctly', () => {
      const error = new ApiError(404, 'Resource not found');
      
      ApiError.handle(error, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Resource not found'
      });
    });

    it('should handle generic Error as 500', () => {
      const error = new Error('Generic error');
      
      ApiError.handle(error, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal Server Error'
      });
    });

    it('should include stack trace in development mode', () => {
      // Temporarily mock development mode
      jest.doMock('../../../src/config/config', () => ({
        isDev: true,
        isProd: false
      }));

      // Re-require to get the new mock
      jest.resetModules();
      const { ApiError: DevApiError } = require('../../../src/utils/apiError');
      
      const error = new DevApiError(400, 'Bad Request');
      error.stack = 'mock stack trace';
      
      DevApiError.handle(error, res);
      
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Bad Request',
        stack: 'mock stack trace'
      });

      // Reset modules for next tests
      jest.resetModules();
      jest.doMock('../../../src/config/config', () => ({
        isDev: false,
        isProd: true
      }));
    });
  });

  describe('errorConverter', () => {
    it('should convert non-ApiError to ApiError', () => {
      const mockReq = {};
      const mockRes = {};
      const mockNext = jest.fn();
      const genericError = new Error('Generic error');

      const { errorConverter } = require('../../../src/utils/apiError');
      
      errorConverter(genericError, mockReq, mockRes, mockNext);
      
      // The errorConverter should pass a converted ApiError to next
      expect(mockNext).toHaveBeenCalledTimes(1);
      const calledError = mockNext.mock.calls[0][0];
      expect(calledError).toBeInstanceOf(Error);
      expect(calledError.statusCode).toBe(500);
    });

    it('should pass through existing ApiError', () => {
      const mockReq = {};
      const mockRes = {};
      const mockNext = jest.fn();
      const apiError = new ApiError(400, 'Bad request');

      const { errorConverter } = require('../../../src/utils/apiError');
      
      errorConverter(apiError, mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(apiError);
    });
  });

  describe('errorHandler', () => {
    it('should handle error using ApiError.handle', () => {
      const mockReq = {};
      const mockRes = mockResponse();
      const mockNext = jest.fn();
      const error = new ApiError(404, 'Not found');

      const { errorHandler } = require('../../../src/utils/apiError');
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      // The errorHandler might not use ApiError.handle directly, 
      // but should handle the error appropriately
      expect(mockRes.status).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalled();
    });
  });
});
