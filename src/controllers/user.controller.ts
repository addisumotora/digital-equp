import { Request, Response, NextFunction } from 'express';
import UserService from '../services/user.service';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { UserRole } from '../types/types';

export default {
  async getUserProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await UserService.getUserById(req.params.id);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }
      return new ApiResponse(res, 200, user).send();
    } catch (err) {
      next(err);
    }
  },

  async updateUserProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const updatedUser = await UserService.updateUser(req.params.id, req.body);
      return new ApiResponse(res, 200, updatedUser, 'Profile updated successfully').send();
    } catch (err) {
      next(err);
    }
  },

  async searchUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = typeof req.query.q === 'string' ? req.query.q : '';
      const users = await UserService.searchUsers(query);
      return new ApiResponse(res, 200, users).send();
    } catch (err) {
      next(err);
    }
  },
  async deleteUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await UserService.deleteUser(req.params.id);
      return new ApiResponse(res, 204, null, 'User deleted successfully').send();
    } catch (err) {
      next(err);
    }
  },
  async getAllUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const users = await UserService.getAllUsers();
      return new ApiResponse(res, 200, users).send();
    } catch (err) {
      next(err);
    }
  },
  async getUserByRole(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const role = req.params.role;
      const users = await UserService.getUserByRole(role as UserRole);
      return new ApiResponse(res, 200, users).send();
    } catch (err) {
      next(err);
    }
  },
  async assignRole(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId, role } = req.body;
      const updatedUser = await UserService.assignRole(userId, role);
      return new ApiResponse(res, 200, updatedUser, 'Role assigned successfully').send();
    } catch (err) {
      next(err);
    }
  },
};