import AuthService from '../../../src/services/auth.service';
import { UserRole } from '../../../src/types/types';
import { ApiError } from '../../../src/utils/apiError';
import User from '../../../src/models/user.model';

jest.mock('../../../src/models/user.model');

describe('AuthService', () => {
  const mockUserData = {
    username: 'john_doe',
    email: 'john@example.com',
    password: 'password123',
    role: UserRole.MEMBER,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should throw error if email already exists', async () => {
      (User.findOne as jest.Mock).mockResolvedValueOnce(true);

      await expect(AuthService.registerUser(mockUserData)).rejects.toThrow(ApiError);
      expect(User.findOne).toHaveBeenCalledWith({ email: mockUserData.email });
    });

    it('should create and return user if email does not exist', async () => {
      const createdUser = { ...mockUserData, _id: 'abc123' };

      (User.findOne as jest.Mock).mockResolvedValueOnce(null);
      (User.create as jest.Mock).mockResolvedValueOnce(createdUser);

      const result = await AuthService.registerUser(mockUserData);

      expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
        email: mockUserData.email,
        role: UserRole.MEMBER,
      }));
      expect(result).toEqual(createdUser);
    });
  });

  describe('authenticateUser', () => {
    it('should return null if user not found', async () => {
      (User.findOne as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockResolvedValue(null),
      });

      const result = await AuthService.authenticateUser('notfound@example.com', 'pass');
      expect(result).toBeNull();
    });

    it('should return null if password is incorrect', async () => {
      const userMock = {
        comparePassword: jest.fn().mockResolvedValue(false),
      };

      (User.findOne as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockResolvedValue(userMock),
      });

      const result = await AuthService.authenticateUser('john@example.com', 'wrongpassword');
      expect(result).toBeNull();
    });

    it('should return user if email and password are correct', async () => {
      const userMock = {
        comparePassword: jest.fn().mockResolvedValue(true),
      };

      (User.findOne as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockResolvedValue(userMock),
      });

      const result = await AuthService.authenticateUser('john@example.com', 'correctpassword');
      expect(result).toBe(userMock);
    });
  });
});
