import { Types } from "mongoose";
import { IUser } from "../models/user.model";
import User from "../models/user.model";
import { ApiError } from "../utils/apiError";
import { UserRole } from "../types/types";

class UserService {
  async getUserById(userId: Types.ObjectId | string): Promise<IUser | null> {
    return User.findById(userId);
  }

  async updateUser(
    userId: Types.ObjectId | string,
    updateData: Partial<{
      username: string;
      email: string;
      password: string;
    }>
  ): Promise<IUser | null> {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (updateData.email && updateData.email !== user.email) {
      if (await User.findOne({ email: updateData.email })) {
        throw new ApiError(400, "Email already in use");
      }
    }

    Object.assign(user, updateData);
    await user.save();
    return user;
  }

  async searchUsers(query: string): Promise<IUser[]> {
    return User.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    }).limit(10);
  }
  async deleteUser(userId: Types.ObjectId | string): Promise<void> {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
  }

  async getAllUsers(): Promise<IUser[]> {
    return User.find().select("-password");
  }
  async getUserByRole(role: UserRole): Promise<IUser[]> {
    const validRoles = ["super_admin", "group_admin", "member"];
    if (!validRoles.includes(role)) {
      throw new ApiError(400, "Invalid role specified");
    }
    return User.find({ role: role }).select("-password");
  }

  async assignRole(
    userId: Types.ObjectId | string,
    role: UserRole
  ): Promise<IUser> {
    const validRoles = ["super_admin", "group_admin", "member"];
    if (!validRoles.includes(role)) {
      throw new ApiError(400, "Invalid role specified");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    user.role = [role];
    await user.save();
    return user;
  }

  async removeRole(
    userId: Types.ObjectId | string,
    role: UserRole
  ): Promise<IUser> {
    const validRoles = ["super_admin", "group_admin", "member"];
    if (!validRoles.includes(role)) {
      throw new ApiError(400, "Invalid role specified");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    user.role = user.role.filter((r) => r !== role);
    await user.save();
    return user;
  }
}

export default new UserService();