import GroupService from '../services/group.service';
import ApiResponse from '../utils/apiResponse';
import ApiError from '../utils/apiError';
import { NextFunction, Request } from 'express';

export default {
  async createGroup(req: Request, res:Response, next: NextFunction) {
    try {
      const { name, description, amount, cycleDuration } = req.body;
      const group = await GroupService.createGroup({
        name,
        description,
        amount,
        cycleDuration,
        creator: req.user.id
      });
      
      new ApiResponse(res, 201, group, 'Group created successfully').send();
    } catch (err) {
      next(err);
    }
  },

  async joinGroup(req: Request, res:Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const group = await GroupService.joinGroup(id, req.user.id);
      new ApiResponse(res, 200, group, 'Successfully joined group').send();
    } catch (err) {
      next(err);
    }
  },

  async getGroupDetails(req: Request, res:Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const group = await GroupService.getGroupWithMembers(id);
      
      if (!group) {
        throw new ApiError(404, 'Group not found');
      }
      
      new ApiResponse(res, 200, group).send();
    } catch (err) {
      next(err);
    }
  },

  async rotatePayout(req: Request, res:Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const group = await GroupService.rotatePayout(id);
      new ApiResponse(res, 200, group, 'Payout rotated successfully').send();
    } catch (err) {
      next(err);
    }
  }
};