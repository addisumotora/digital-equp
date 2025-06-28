import { Request, Response, NextFunction } from 'express';
import AuthController from '../../../src/controllers/auth.controller';
import AuthService from '../../../src/services/auth.service';
import UserService from '../../../src/services/user.service';
import { generateToken } from '../../../src/utils/auth';
import { ApiError } from '../../../src/utils/apiError';
import { UserRole, AuthenticatedRequest } from '../../../src/types/types';

// Mock dependencies
jest.mock('../../../src/services/auth.service');
jest.mock('../../../src/services/user.service');
jest.mock('../../../src/utils/auth');

const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;
const mockUserService = UserService as jest.Mocked<typeof UserService>;
const mockGenerateToken = generateToken as jest.MockedFunction<typeof generateToken>;

describe('AuthController', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.MEMBER
      };

      const mockUser = {
        _id: 'user123',
        ...userData,
        role: [UserRole.MEMBER]
      };

      const mockToken = 'jwt-token';

      mockRequest.body = userData;
      mockAuthService.registerUser.mockResolvedValue(mockUser as any);
      mockGenerateToken.mockReturnValue(mockToken);

      // Mock ApiResponse by intercepting the constructor
      const mockSend = jest.fn();
      jest.doMock('../../../src/utils/apiResponse', () => ({
        ApiResponse: jest.fn().mockImplementation(() => ({
          send: mockSend
        }))
      }));

      await AuthController.register(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockAuthService.registerUser).toHaveBeenCalledWith(userData);
      expect(mockGenerateToken).toHaveBeenCalledWith(mockUser);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle registration error', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.MEMBER
      };

      const error = new ApiError(400, 'Email already exists');
      mockRequest.body = userData;
      mockAuthService.registerUser.mockRejectedValue(error);

      await AuthController.register(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        role: [UserRole.MEMBER]
      };

      const mockToken = 'jwt-token';

      mockRequest.body = loginData;
      mockAuthService.authenticateUser.mockResolvedValue(mockUser as any);
      mockGenerateToken.mockReturnValue(mockToken);

      await AuthController.login(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockAuthService.authenticateUser).toHaveBeenCalledWith(
        loginData.email,
        loginData.password
      );
      expect(mockGenerateToken).toHaveBeenCalledWith(mockUser);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      mockRequest.body = loginData;
      mockAuthService.authenticateUser.mockResolvedValue(null);

      await AuthController.login(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'Invalid credentials'
        })
      );
    });

    it('should handle login error', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const error = new Error('Database error');
      mockRequest.body = loginData;
      mockAuthService.authenticateUser.mockRejectedValue(error);

      await AuthController.login(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user successfully', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        role: [UserRole.MEMBER]
      };

      mockRequest.user = { id: 'user123', role: 'member' };
      
      // Mock mongoose Types.ObjectId constructor
      const mockObjectId = jest.fn().mockReturnValue('mocked-objectid');
      jest.doMock('mongoose', () => ({
        Types: {
          ObjectId: mockObjectId
        }
      }));

      mockUserService.getUserById.mockResolvedValue(mockUser as any);

      await AuthController.getCurrentUser(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockUserService.getUserById).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle missing user information', async () => {
      mockRequest.user = undefined;

      await AuthController.getCurrentUser(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: 'User information is missing'
        })
      );
    });

    it('should handle missing user id', async () => {
      mockRequest.user = { id: '', role: 'member' };

      await AuthController.getCurrentUser(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: 'User information is missing'
        })
      );
    });

    it('should handle service error', async () => {
      const error = new Error('Database error');
      mockRequest.user = { id: '507f1f77bcf86cd799439011', role: 'member' }; // Valid ObjectId format
      mockUserService.getUserById.mockRejectedValue(error);

      await AuthController.getCurrentUser(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
}); 