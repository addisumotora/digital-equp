import { generateToken } from "../utils/auth";
import { ApiResponse } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";

import AuthService from "../services/auth.service";
import UserService from "../services/user.service";
import { Response, NextFunction } from "express";
import {
  AuthenticatedRequest,
  LoginRequest,
  RegisterRequest,
} from "../types/types";
import { IUser } from "../models/user.model";

export default {
  async register(
    req: RegisterRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      console.log("Register request received:", req.body);
      const { username, email, password } = req.body;
      const user: IUser = await AuthService.registerUser({
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
      const { email, password } = req.body;
      const user: IUser | null = await AuthService.authenticateUser(
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
      if (!req.user || !req.user.id) {
        throw new ApiError(400, "User information is missing");
      }
      const mongoose = await import("mongoose");
      const userId = new mongoose.Types.ObjectId(req.user.id);
      const user: IUser | null = await UserService.getUserById(userId);

      new ApiResponse(res, 200, user).send();
    } catch (err) {
      next(err);
    }
  },
};
