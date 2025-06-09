import { Request, Response, NextFunction } from "express";
import GroupService from "../services/group.service";
import { ApiResponse } from "../utils/apiResponse";
import { AuthenticatedRequest } from "../types/types";
import { ApiError } from "../utils/apiError";
import { get } from "http";

export default {
  async createGroup(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { name, description, amount, cycleDuration } = req.body;
      if (!req.user?.id) {
        throw new Error("User ID is required to create a group");
      }
      const group = await GroupService.createGroup({
        name,
        description,
        amount,
        cycleDuration,
        creator: req.user.id,
      });

      return new ApiResponse(
        res,
        201,
        group,
        "Group created successfully"
      ).send();
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
        throw new Error("User ID is required to join a group");
      }
      const group = await GroupService.joinGroup(id, req.user.id);
      return new ApiResponse(
        res,
        200,
        group,
        "Successfully joined group"
      ).send();
    } catch (err) {
      next(err);
    }
  },

  async getGroup(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const group = await GroupService.getGroupById(id);

      if (!group) {
        throw new ApiError(404, "Group not found");
      }

      return new ApiResponse(res, 200, group).send();
    } catch (err) {
      next(err);
    }
  },
  async assignAdmin(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params; // group id
      const { userId } = req.body; // user to assign as admin

      if (!req.user?.id) {
        throw new Error("User ID is required to assign admin");
      }

      // No role check here! Handled by authorize middleware in routes.

      const group = await GroupService.assignAdmin(id, userId);
      return new ApiResponse(
        res,
        200,
        group,
        "Admin assigned successfully"
      ).send();
    } catch (err) {
      next(err);
    }
  },

  async deleteGroup(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params; // group id

      if (!req.user?.id) {
        throw new Error("User ID is required to delete a group");
      }

      await GroupService.deleteGroup(id);
      return new ApiResponse(
        res,
        200,
        null,
        "Group deleted successfully"
      ).send();
    } catch (err) {
      next(err);
    }
  },

  async getAllGroups(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const groups = await GroupService.getAllGroups();
      return new ApiResponse(res, 200, groups).send();
    } catch (err) {
      next(err);
    }
  },

  async getUserGroups(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new Error("User ID is required to fetch groups");
      }
      const groups = await GroupService.getUserGroups(req.user.id);
      return new ApiResponse(res, 200, groups).send();
    } catch (err) {
      next(err);
    }
  },

  async removeAdmin(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params; 
      const { userId } = req.body; 

      if (!req.user?.id) {
        throw new Error("User ID is required to remove admin");
      }

      const group = await GroupService.removeAdmin(id, userId);
      return new ApiResponse(
        res,
        200,
        group,
        "Admin removed successfully"
      ).send();
    } catch (err) {
      next(err);
    }
  },

  async removeUserFromGroup(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params; 
      const { userId } = req.body; 

      if (!req.user?.id) {
        throw new Error("User ID is required to remove a user from group");
      }

      const group = await GroupService.removeUserFromGroup(id, userId);
      return new ApiResponse(
        res,
        200,
        group,
        "User removed from group successfully"
      ).send();
    } catch (err) {
      next(err);
    }
  },

  async rotatePayout(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const group = await GroupService.rotatePayout(id);
      return new ApiResponse(
        res,
        200,
        group,
        "Payout rotated successfully"
      ).send();
    } catch (err) {
      next(err);
    }
  },
};
