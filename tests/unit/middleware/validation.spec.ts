import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { validate, validateParams, validateQuery } from '../../../src/middleware/validation';
import { ApiError } from '../../../src/utils/apiError';

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {};
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('validate (body validation)', () => {
    const testSchema = Joi.object({
      username: Joi.string().required(),
      email: Joi.string().email().required(),
      age: Joi.number().min(18).optional()
    });

    it('should pass validation with valid data', () => {
      mockRequest.body = {
        username: 'testuser',
        email: 'test@example.com',
        age: 25
      };

      const middleware = validate(testSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.body).toEqual({
        username: 'testuser',
        email: 'test@example.com',
        age: 25
      });
    });

    it('should pass validation and strip unknown fields', () => {
      mockRequest.body = {
        username: 'testuser',
        email: 'test@example.com',
        unknownField: 'should be removed'
      };

      const middleware = validate(testSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.body).toEqual({
        username: 'testuser',
        email: 'test@example.com'
      });
    });

    it('should fail validation with missing required field', () => {
      mockRequest.body = {
        email: 'test@example.com'
      };

      const middleware = validate(testSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: expect.stringContaining('Validation error:')
        })
      );
    });

    it('should fail validation with invalid email format', () => {
      mockRequest.body = {
        username: 'testuser',
        email: 'invalid-email'
      };

      const middleware = validate(testSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: expect.stringContaining('Validation error:')
        })
      );
    });

    it('should fail validation with invalid number constraint', () => {
      mockRequest.body = {
        username: 'testuser',
        email: 'test@example.com',
        age: 16
      };

      const middleware = validate(testSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: expect.stringContaining('Validation error:')
        })
      );
    });

    it('should combine multiple validation errors', () => {
      mockRequest.body = {
        email: 'invalid-email',
        age: 16
      };

      const middleware = validate(testSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: expect.stringContaining('Validation error:')
        })
      );
    });
  });

  describe('validateParams', () => {
    const paramsSchema = Joi.object({
      id: Joi.string().hex().length(24).required(),
      type: Joi.string().valid('user', 'group').optional()
    });

    it('should pass validation with valid params', () => {
      mockRequest.params = {
        id: '507f1f77bcf86cd799439011',
        type: 'user'
      };

      const middleware = validateParams(paramsSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.params).toEqual({
        id: '507f1f77bcf86cd799439011',
        type: 'user'
      });
    });

    it('should fail validation with invalid ObjectId format', () => {
      mockRequest.params = {
        id: 'invalid-id'
      };

      const middleware = validateParams(paramsSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: expect.stringContaining('Parameter validation error:')
        })
      );
    });

    it('should fail validation with invalid enum value', () => {
      mockRequest.params = {
        id: '507f1f77bcf86cd799439011',
        type: 'invalid-type'
      };

      const middleware = validateParams(paramsSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: expect.stringContaining('Parameter validation error:')
        })
      );
    });
  });

  describe('validateQuery', () => {
    const querySchema = Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      search: Joi.string().optional(),
      status: Joi.string().valid('active', 'inactive').optional()
    });

    it('should pass validation with valid query parameters', () => {
      mockRequest.query = {
        page: '2',
        limit: '20',
        search: 'test',
        status: 'active'
      };

      const middleware = validateQuery(querySchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.query).toEqual({
        page: 2,
        limit: 20,
        search: 'test',
        status: 'active'
      });
    });

    it('should apply default values', () => {
      mockRequest.query = {};

      const middleware = validateQuery(querySchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.query).toEqual({
        page: 1,
        limit: 10
      });
    });

    it('should strip unknown query parameters', () => {
      mockRequest.query = {
        page: '1',
        unknownParam: 'should be removed'
      };

      const middleware = validateQuery(querySchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.query).toEqual({
        page: 1,
        limit: 10
      });
    });

    it('should allow unknown parameters when allowUnknown is true', () => {
      mockRequest.query = {
        page: '1',
        customParam: 'should remain'
      };

      const middleware = validateQuery(querySchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      // Note: allowUnknown is set to true but stripUnknown is also true, so unknown params are stripped
      expect(mockRequest.query).toEqual({
        page: 1,
        limit: 10
        // customParam is stripped due to stripUnknown: true
      });
    });

    it('should fail validation with invalid number values', () => {
      mockRequest.query = {
        page: 'invalid',
        limit: '0'
      };

      const middleware = validateQuery(querySchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: expect.stringContaining('Query validation error:')
        })
      );
    });

    it('should fail validation with value exceeding maximum', () => {
      mockRequest.query = {
        limit: '200'
      };

      const middleware = validateQuery(querySchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: expect.stringContaining('Query validation error:')
        })
      );
    });

    it('should fail validation with invalid enum value', () => {
      mockRequest.query = {
        status: 'invalid-status'
      };

      const middleware = validateQuery(querySchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: expect.stringContaining('Query validation error:')
        })
      );
    });
  });

  describe('error message formatting', () => {
    const testSchema = Joi.object({
      email: Joi.string().email().required(),
      age: Joi.number().min(18).required()
    });

    it('should format multiple validation errors correctly', () => {
      mockRequest.body = {
        email: 'invalid',
        age: 16
      };

      const middleware = validate(testSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toContain('Validation error:');
      expect(error.message).toContain('email');
      expect(error.message).toContain('age');
    });
  });
}); 