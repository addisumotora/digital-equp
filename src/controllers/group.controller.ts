import { Request, Response, NextFunction } from 'express';
import GroupService from '../services/group.service';
import { ApiResponse } from "../utils/apiResponse";
import { AuthenticatedRequest } from '../types/types';

export default {
  async createGroup(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { name, description, amount, cycleDuration } = req.body;
      if (!req.user?.id) {
        throw new Error('User ID is required to create a group');
      }
      const group = await GroupService.createGroup({
        name,
        description,
        amount,
        cycleDuration,
        creator: req.user.id
      });

      return new ApiResponse(res, 201, group, 'Group created successfully').send();
    } catch (err) {
      next(err);
    }
  },

  async joinGroup(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      if (!req.user?.id) {
        throw new Error('User ID is required to join a group');
      }
      const group = await GroupService.joinGroup(id, req.user.id);
      return new ApiResponse(res, 200, group, 'Successfully joined group').send();
    } catch (err) {
      next(err);
    }
  },

//   async getGroupDetails(
//     req: Request,
//     res: Response,
//     next: NextFunction
//   ): Promise<void> {
//     try {
//       const { id } = req.params;
//       const group = await GroupService.getGroupWithMembers(id);

//       if (!group) {
//         throw new ApiError(404, 'Group not found');
//       }

//       return new ApiResponse(res, 200, group).send();
//     } catch (err) {
//       next(err);
//     }
//   },

  async rotatePayout(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const group = await GroupService.rotatePayout(id);
      return new ApiResponse(res, 200, group, 'Payout rotated successfully').send();
    } catch (err) {
      next(err);
    }
  }
};