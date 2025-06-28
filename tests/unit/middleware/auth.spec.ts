import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate, authorize } from '../../../src/middleware/auth';
import { ApiError } from '../../../src/utils/apiError';
import { AuthenticatedRequest } from '../../../src/types/types';
import config from '../../../src/config/config';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../../../src/config/config', () => ({
  jwt: {
    secret: 'test-secret'
  }
}));

const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockRequest = {
      headers: {}
    };
    mockResponse = {};
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should authenticate user with valid token', () => {
      const mockDecoded = {
        id: 'user123',
        email: 'test@example.com',
        role: 'member'
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };

      mockJwt.verify.mockReturnValue(mockDecoded as any);

      authenticate(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockJwt.verify).toHaveBeenCalledWith('valid-token', config.jwt.secret);
      expect((mockRequest as any).user).toEqual(mockDecoded);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject request without authorization header', () => {
      mockRequest.headers = {};

      authenticate(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'Authentication required'
        })
      );
    });

    it('should reject request with invalid authorization format', () => {
      mockRequest.headers = {
        authorization: 'Invalid token-format'
      };

      authenticate(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'Authentication required'
        })
      );
    });

    it('should reject request with malformed Bearer token', () => {
      mockRequest.headers = {
        authorization: 'Bearer'
      };

      authenticate(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'Authentication required'
        })
      );
    });

    it('should reject request with invalid token', () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      };

      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      authenticate(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'Invalid or expired token'
        })
      );
    });

    it('should reject request with expired token', () => {
      mockRequest.headers = {
        authorization: 'Bearer expired-token'
      };

      const expiredError = new Error('Token expired');
      expiredError.name = 'TokenExpiredError';
      mockJwt.verify.mockImplementation(() => {
        throw expiredError;
      });

      authenticate(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'Invalid or expired token'
        })
      );
    });
  });

  describe('authorize', () => {
    it('should authorize user with correct role', () => {
      mockRequest.user = {
        id: 'user123',
        role: 'super_admin'
      };

      const authorizeMiddleware = authorize('super_admin');
      authorizeMiddleware(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should authorize user with one of multiple allowed roles', () => {
      mockRequest.user = {
        id: 'user123',
        role: 'group_admin'
      };

      const authorizeMiddleware = authorize('super_admin', 'group_admin');
      authorizeMiddleware(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should authorize user with array of roles', () => {
      mockRequest.user = {
        id: 'user123',
        role: ['member', 'group_admin']
      };

      const authorizeMiddleware = authorize('group_admin');
      authorizeMiddleware(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject unauthenticated user', () => {
      mockRequest.user = undefined;

      const authorizeMiddleware = authorize('super_admin');
      authorizeMiddleware(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: 'Access denied: not authenticated'
        })
      );
    });

    it('should reject user with insufficient role', () => {
      mockRequest.user = {
        id: 'user123',
        role: 'member'
      };

      const authorizeMiddleware = authorize('super_admin');
      authorizeMiddleware(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: 'Access denied: requires role(s) super_admin'
        })
      );
    });

    it('should reject user without any of the required roles', () => {
      mockRequest.user = {
        id: 'user123',
        role: 'member'
      };

      const authorizeMiddleware = authorize('super_admin', 'group_admin');
      authorizeMiddleware(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: 'Access denied: requires role(s) super_admin, group_admin'
        })
      );
    });

    it('should handle user with array of roles not having required role', () => {
      mockRequest.user = {
        id: 'user123',
        role: ['member', 'basic_user']
      };

      const authorizeMiddleware = authorize('super_admin');
      authorizeMiddleware(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: 'Access denied: requires role(s) super_admin'
        })
      );
    });

    it('should authorize when user has one role as string matching requirements', () => {
      mockRequest.user = {
        id: 'user123',
        role: 'super_admin'
      };

      const authorizeMiddleware = authorize('super_admin', 'group_admin');
      authorizeMiddleware(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('integration tests', () => {
    it('should work with both authenticate and authorize middleware', () => {
      const mockDecoded = {
        id: 'user123',
        email: 'test@example.com',
        role: 'super_admin'
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };

      mockJwt.verify.mockReturnValue(mockDecoded as any);

      // First authenticate
      authenticate(mockRequest as any, mockResponse as Response, mockNext);
      expect((mockRequest as any).user).toEqual(mockDecoded);
      expect(mockNext).toHaveBeenCalledWith();

      // Reset next mock
      mockNext.mockClear();

      // Then authorize
      const authorizeMiddleware = authorize('super_admin');
      authorizeMiddleware(mockRequest as any, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });
  });
}); 