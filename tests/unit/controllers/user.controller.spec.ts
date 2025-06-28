import { Request, Response, NextFunction } from 'express';
import UserController from '../../../src/controllers/user.controller';
import UserService from '../../../src/services/user.service';
import { ApiError } from '../../../src/utils/apiError';
import { UserRole } from '../../../src/types/types';

// Mock dependencies
jest.mock('../../../src/services/user.service');

const mockUserService = UserService as jest.Mocked<typeof UserService>;

describe('UserController', () => {
  let mockRequest: Partial<Request>;
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

  describe('getUserProfile', () => {
    it('should get user profile successfully', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        role: [UserRole.MEMBER]
      };

      mockRequest.params = { id: 'user123' };
      mockUserService.getUserById.mockResolvedValue(mockUser as any);

      await UserController.getUserProfile(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserService.getUserById).toHaveBeenCalledWith('user123');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle user not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockUserService.getUserById.mockResolvedValue(null);

      await UserController.getUserProfile(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: 'User not found'
        })
      );
    });

    it('should handle service error', async () => {
      const error = new Error('Database error');
      mockRequest.params = { id: 'user123' };
      mockUserService.getUserById.mockRejectedValue(error);

      await UserController.getUserProfile(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        username: 'updateduser',
        email: 'updated@example.com'
      };

      const updatedUser = {
        _id: 'user123',
        ...updateData,
        role: [UserRole.MEMBER]
      };

      mockRequest.params = { id: 'user123' };
      mockRequest.body = updateData;
      mockUserService.updateUser.mockResolvedValue(updatedUser as any);

      await UserController.updateUserProfile(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserService.updateUser).toHaveBeenCalledWith('user123', updateData);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle update error', async () => {
      const error = new ApiError(400, 'Email already in use');
      mockRequest.params = { id: 'user123' };
      mockRequest.body = { email: 'existing@example.com' };
      mockUserService.updateUser.mockRejectedValue(error);

      await UserController.updateUserProfile(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('searchUsers', () => {
    it('should search users successfully', async () => {
      const mockUsers = [
        { _id: 'user1', username: 'testuser1', email: 'test1@example.com' },
        { _id: 'user2', username: 'testuser2', email: 'test2@example.com' }
      ];

      mockRequest.query = { q: 'test' };
      mockUserService.searchUsers.mockResolvedValue(mockUsers as any);

      await UserController.searchUsers(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserService.searchUsers).toHaveBeenCalledWith('test');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle empty query', async () => {
      mockRequest.query = {};
      mockUserService.searchUsers.mockResolvedValue([]);

      await UserController.searchUsers(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserService.searchUsers).toHaveBeenCalledWith('');
    });

    it('should handle non-string query', async () => {
      mockRequest.query = { q: '123' };
      mockUserService.searchUsers.mockResolvedValue([]);

      await UserController.searchUsers(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserService.searchUsers).toHaveBeenCalledWith('123');
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      mockRequest.params = { id: 'user123' };
      mockUserService.deleteUser.mockResolvedValue();

      await UserController.deleteUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserService.deleteUser).toHaveBeenCalledWith('user123');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle delete error', async () => {
      const error = new ApiError(404, 'User not found');
      mockRequest.params = { id: 'nonexistent' };
      mockUserService.deleteUser.mockRejectedValue(error);

      await UserController.deleteUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getAllUsers', () => {
    it('should get all users successfully', async () => {
      const mockUsers = [
        { _id: 'user1', username: 'user1', email: 'user1@example.com' },
        { _id: 'user2', username: 'user2', email: 'user2@example.com' }
      ];

      mockUserService.getAllUsers.mockResolvedValue(mockUsers as any);

      await UserController.getAllUsers(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserService.getAllUsers).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('getUserByRole', () => {
    it('should get users by role successfully', async () => {
      const mockUsers = [
        { _id: 'user1', username: 'admin1', role: [UserRole.GROUP_ADMIN] }
      ];

      mockRequest.params = { role: UserRole.GROUP_ADMIN };
      mockUserService.getUserByRole.mockResolvedValue(mockUsers as any);

      await UserController.getUserByRole(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserService.getUserByRole).toHaveBeenCalledWith(UserRole.GROUP_ADMIN);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('assignRole', () => {
    it('should assign role successfully', async () => {
      const updatedUser = {
        _id: 'user123',
        username: 'testuser',
        role: [UserRole.GROUP_ADMIN]
      };

      mockRequest.params = { id: 'user123' };
      mockRequest.body = { role: UserRole.GROUP_ADMIN };
      mockUserService.assignRole.mockResolvedValue(updatedUser as any);

      await UserController.assignRole(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserService.assignRole).toHaveBeenCalledWith('user123', UserRole.GROUP_ADMIN);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle assign role error', async () => {
      const error = new ApiError(400, 'Invalid role specified');
      mockRequest.params = { id: 'user123' };
      mockRequest.body = { role: 'invalid_role' };
      mockUserService.assignRole.mockRejectedValue(error);

      await UserController.assignRole(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('removeRole', () => {
    it('should remove role successfully', async () => {
      const updatedUser = {
        _id: 'user123',
        username: 'testuser',
        role: [UserRole.MEMBER]
      };

      mockRequest.params = { id: 'user123' };
      mockRequest.body = { role: UserRole.GROUP_ADMIN };
      mockUserService.removeRole.mockResolvedValue(updatedUser as any);

      await UserController.removeRole(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserService.removeRole).toHaveBeenCalledWith('user123', UserRole.GROUP_ADMIN);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle missing parameters', async () => {
      mockRequest.params = {};
      mockRequest.body = {};

      await UserController.removeRole(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: 'User ID and role are required'
        })
      );
    });

    it('should handle remove role error', async () => {
      const error = new ApiError(404, 'User not found');
      mockRequest.params = { id: 'nonexistent' };
      mockRequest.body = { role: UserRole.GROUP_ADMIN };
      mockUserService.removeRole.mockRejectedValue(error);

      await UserController.removeRole(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
}); 