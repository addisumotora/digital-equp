import { generateToken } from "../utils/auth";
import UserService from "../services/user.service";
import ApiResponse from "../utils/apiResponse";
import ApiError from "../utils/apiError";
import { Response, NextFunction } from "express";
import {
  AuthenticatedRequest,
  LoginRequest,
  RegisterRequest,
} from "../types/types";
import { UserType } from "../types/types";

export default {
  async register(
    req: RegisterRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user: UserType = await UserService.createUser({
        username,
        email,
        password,
      });

      const token: string = generateToken(user);
      new ApiResponse(
        res,
        201,
        { user, token },
        "User registered successfully"
      ).send();
    } catch (err) {
      next(err);
    }
  },

  async login(
    req: LoginRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user: UserType | null = await UserService.authenticateUser(
        email,
        password
      );

      if (!user) {
        throw new ApiError(401, "Invalid credentials");
      }

      const token: string = generateToken(user);
      new ApiResponse(res, 200, { user, token }, "Login successful").send();
    } catch (err) {
      next(err);
    }
  },

  async getCurrentUser(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user: UserType | null = await UserService.getUserById(req.user.id);

      new ApiResponse(res, 200, user).send();
    } catch (err) {
      next(err);
    }
  },
};
