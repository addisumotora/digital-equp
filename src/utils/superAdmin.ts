import config from '../config/config';
import authService from '../services/auth.service';
import userService from '../services/user.service';
import { UserRole } from '../types/types';

export async function ensureSuperAdmin() {
  const superAdmin = await userService.getUserByRole(UserRole.SUPER_ADMIN);
  if (!(superAdmin.length > 0)) {
    await authService.registerUser({
      username: config.superAdmin.username,
      email: config.superAdmin.email,
      password: config.superAdmin.password,
      role: UserRole.SUPER_ADMIN
    });
    console.log(
      `Super admin created with username: ${config.superAdmin.username}`
    );
  }
}