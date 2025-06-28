import { Request, Response, NextFunction } from 'express';
import GroupController from '../../../src/controllers/group.controller';
import GroupService from '../../../src/services/group.service';
import { ApiError } from '../../../src/utils/apiError';
import { AuthenticatedRequest } from '../../../src/types/types';

// Mock dependencies
jest.mock('../../../src/services/group.service');

const mockGroupService = GroupService as jest.Mocked<typeof GroupService>;

describe('GroupController', () => {
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

  describe('createGroup', () => {
    it('should create group successfully', async () => {
      const groupData = {
        name: 'Test Group',
        description: 'Test Description',
        amount: 1000,
        cycleDuration: 30
      };

      const mockGroup = {
        _id: 'group123',
        ...groupData,
        creator: 'user123',
        members: ['user123']
      };

      mockRequest.body = groupData;
      mockRequest.user = { id: 'user123', role: 'member' };
      mockGroupService.createGroup.mockResolvedValue(mockGroup as any);

      await GroupController.createGroup(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockGroupService.createGroup).toHaveBeenCalledWith({
        ...groupData,
        creator: 'user123'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle missing user ID', async () => {
      mockRequest.body = { name: 'Test Group' };
      mockRequest.user = undefined;

      await GroupController.createGroup(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle service error', async () => {
      const error = new Error('Database error');
      mockRequest.body = { name: 'Test Group' };
      mockRequest.user = { id: 'user123', role: 'member' };
      mockGroupService.createGroup.mockRejectedValue(error);

      await GroupController.createGroup(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('joinGroup', () => {
    it('should join group successfully', async () => {
      const mockGroup = {
        _id: 'group123',
        name: 'Test Group',
        members: ['user123', 'user456']
      };

      mockRequest.params = { id: 'group123' };
      mockRequest.user = { id: 'user456', role: 'member' };
      mockGroupService.joinGroup.mockResolvedValue(mockGroup as any);

      await GroupController.joinGroup(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockGroupService.joinGroup).toHaveBeenCalledWith('group123', 'user456');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle missing user ID', async () => {
      mockRequest.params = { id: 'group123' };
      mockRequest.user = undefined;

      await GroupController.joinGroup(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle join error', async () => {
      const error = new ApiError(400, 'User already in group');
      mockRequest.params = { id: 'group123' };
      mockRequest.user = { id: 'user456', role: 'member' };
      mockGroupService.joinGroup.mockRejectedValue(error);

      await GroupController.joinGroup(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getGroup', () => {
    it('should get group successfully', async () => {
      const mockGroup = {
        _id: 'group123',
        name: 'Test Group',
        members: ['user123']
      };

      mockRequest.params = { id: 'group123' };
      mockGroupService.getGroupById.mockResolvedValue(mockGroup as any);

      await GroupController.getGroup(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockGroupService.getGroupById).toHaveBeenCalledWith('group123');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle group not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockGroupService.getGroupById.mockResolvedValue(null);

      await GroupController.getGroup(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: 'Group not found'
        })
      );
    });

    it('should handle service error', async () => {
      const error = new Error('Database error');
      mockRequest.params = { id: 'group123' };
      mockGroupService.getGroupById.mockRejectedValue(error);

      await GroupController.getGroup(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('assignAdmin', () => {
    it('should assign admin successfully', async () => {
      const mockGroup = {
        _id: 'group123',
        name: 'Test Group',
        admin: 'user456'
      };

      mockRequest.params = { id: 'group123' };
      mockRequest.body = { userId: 'user456' };
      mockRequest.user = { id: 'user123', role: 'member' };
      mockGroupService.assignAdmin.mockResolvedValue(mockGroup as any);

      await GroupController.assignAdmin(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockGroupService.assignAdmin).toHaveBeenCalledWith('group123', 'user456');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle missing user ID', async () => {
      mockRequest.params = { id: 'group123' };
      mockRequest.body = { userId: 'user456' };
      mockRequest.user = undefined;

      await GroupController.assignAdmin(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle assign admin error', async () => {
      const error = new ApiError(404, 'Group not found');
      mockRequest.params = { id: 'nonexistent' };
      mockRequest.body = { userId: 'user456' };
      mockRequest.user = { id: 'user123', role: 'member' };
      mockGroupService.assignAdmin.mockRejectedValue(error);

      await GroupController.assignAdmin(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteGroup', () => {
    it('should delete group successfully', async () => {
      mockRequest.params = { id: 'group123' };
      mockRequest.user = { id: 'user123', role: 'member' };
      mockGroupService.deleteGroup.mockResolvedValue();

      await GroupController.deleteGroup(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockGroupService.deleteGroup).toHaveBeenCalledWith('group123');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle missing user ID', async () => {
      mockRequest.params = { id: 'group123' };
      mockRequest.user = undefined;

      await GroupController.deleteGroup(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle delete error', async () => {
      const error = new ApiError(404, 'Group not found');
      mockRequest.params = { id: 'nonexistent' };
      mockRequest.user = { id: 'user123', role: 'member' };
      mockGroupService.deleteGroup.mockRejectedValue(error);

      await GroupController.deleteGroup(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getAllGroups', () => {
    it('should get all groups successfully', async () => {
      const mockGroups = [
        { _id: 'group1', name: 'Group 1' },
        { _id: 'group2', name: 'Group 2' }
      ];

      mockGroupService.getAllGroups.mockResolvedValue(mockGroups as any);

      await GroupController.getAllGroups(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockGroupService.getAllGroups).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle service error', async () => {
      const error = new Error('Database error');
      mockGroupService.getAllGroups.mockRejectedValue(error);

      await GroupController.getAllGroups(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getUserGroups', () => {
    it('should get user groups successfully', async () => {
      const mockGroups = [
        { _id: 'group1', name: 'Group 1' },
        { _id: 'group2', name: 'Group 2' }
      ];

      mockRequest.user = { id: 'user123', role: 'member' };
      mockGroupService.getUserGroups.mockResolvedValue(mockGroups as any);

      await GroupController.getUserGroups(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockGroupService.getUserGroups).toHaveBeenCalledWith('user123');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle missing user ID', async () => {
      mockRequest.user = undefined;

      await GroupController.getUserGroups(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('removeAdmin', () => {
    it('should remove admin successfully', async () => {
      const mockGroup = {
        _id: 'group123',
        name: 'Test Group',
        admin: null
      };

      mockRequest.params = { id: 'group123' };
      mockRequest.body = { userId: 'user456' };
      mockRequest.user = { id: 'user123', role: 'member' };
      mockGroupService.removeAdmin.mockResolvedValue(mockGroup as any);

      await GroupController.removeAdmin(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockGroupService.removeAdmin).toHaveBeenCalledWith('group123', 'user456');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle missing user ID', async () => {
      mockRequest.params = { id: 'group123' };
      mockRequest.body = { userId: 'user456' };
      mockRequest.user = undefined;

      await GroupController.removeAdmin(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('removeUserFromGroup', () => {
    it('should remove user from group successfully', async () => {
      const mockGroup = {
        _id: 'group123',
        name: 'Test Group',
        members: ['user123']
      };

      mockRequest.params = { id: 'group123' };
      mockRequest.body = { userId: 'user456' };
      mockRequest.user = { id: 'user123', role: 'member' };
      mockGroupService.removeUserFromGroup.mockResolvedValue(mockGroup as any);

      await GroupController.removeUserFromGroup(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockGroupService.removeUserFromGroup).toHaveBeenCalledWith('group123', 'user456');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle missing user ID', async () => {
      mockRequest.params = { id: 'group123' };
      mockRequest.body = { userId: 'user456' };
      mockRequest.user = undefined;

      await GroupController.removeUserFromGroup(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('rotatePayout', () => {
    it('should rotate payout successfully', async () => {
      const mockGroup = {
        _id: 'group123',
        name: 'Test Group',
        currentWinner: 'user456',
        currentCycle: 2
      };

      mockRequest.params = { id: 'group123' };
      mockGroupService.rotatePayout.mockResolvedValue(mockGroup as any);

      await GroupController.rotatePayout(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockGroupService.rotatePayout).toHaveBeenCalledWith('group123');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle rotate payout error', async () => {
      const error = new ApiError(400, 'No eligible members for payout');
      mockRequest.params = { id: 'group123' };
      mockGroupService.rotatePayout.mockRejectedValue(error);

      await GroupController.rotatePayout(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
}); 