import { Types } from 'mongoose';
import { IUser } from '../models/user.model';
import User from '../models/user.model';
import { ApiError } from '../utils/apiError';

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
      throw new ApiError(404, 'User not found');
    }

    if (updateData.email && updateData.email !== user.email) {
      if (await User.findOne({ email: updateData.email })) {
        throw new ApiError(400, 'Email already in use');
      }
    }

    Object.assign(user, updateData);
    await user.save();
    return user;
  }

  async getUserGroups(userId: Types.ObjectId | string): Promise<any[]> {
    // Implement logic to fetch groups for a user
    // Example: return Group.find({ members: userId });
    throw new Error('getUserGroups not implemented');
  }

  async searchUsers(query: string): Promise<IUser[]> {
    return User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).limit(10);
  }
}

export default new UserService();