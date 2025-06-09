import User from '../models/user.model';
import { IUser } from '../models/user.model';
import { UserRole } from '../types/types';
import { ApiError } from '../utils/apiError';


class AuthService {
  async registerUser(userData: {
    username: string;
    email: string;
    password: string;
    role?: UserRole; 
  }): Promise<IUser> {
    if (await User.findOne({ email: userData.email })) {
      throw new ApiError(400, 'Email already exists');
    }
    userData.role = UserRole.MEMBER; 
    const user = await User.create(userData);
    return user;
  }

  async authenticateUser(
    email: string,
    password: string
  ): Promise<IUser | null> {
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.comparePassword(password))) {
      return null;
    }

    return user;
  }
}

export default new AuthService();