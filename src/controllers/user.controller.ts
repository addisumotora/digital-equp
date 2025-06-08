import UserService from '../services/user.service';
import ApiResponse from '../utils/apiResponse';
import ApiError from '../utils/apiError';
import { Request, Response, NextFunction } from 'express';

export default {
  async getUserProfile(req: Request, res:Response, next: NextFunction) {
    try {
      const user = await UserService.getUserById(req.params.id);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }
      new ApiResponse(res, 200, user).send();
    } catch (err) {
      next(err);
    }
  },

  async updateUserProfile(req: Request, res:Response, next: NextFunction) {
    try {
      const updatedUser = await UserService.updateUser(req.params.id, req.body);
      new ApiResponse(res, 200, updatedUser, 'Profile updated successfully').send();
    } catch (err) {
      next(err);
    }
  },

  async getUserGroups(req: Request, res:Response, next: NextFunction) {
    try {
      const groups = await UserService.getUserGroups(req.params.id);
      new ApiResponse(res, 200, groups).send();
    } catch (err) {
      next(err);
    }
  },

  async searchUsers(req: Request, res:Response, next: NextFunction) {
    try {
      const users = await UserService.searchUsers(req.query.q);
      new ApiResponse(res, 200, users).send();
    } catch (err) {
      next(err);
    }
  }
};