import { Types } from "mongoose";
import UserService from "services/user.service";
import User from "models/user.model";
import { ApiError } from "utils/apiError";
import { UserRole } from "types/types";


jest.mock("../models/user.model");

describe("UserService", () => {
  const mockUserId = new Types.ObjectId();
  const mockUser = {
    _id: mockUserId,
    username: "testuser",
    email: "test@example.com",
    password: "hashedpassword",
    role: ["member"],
    save: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getUserById", () => {
    it("should return user if found", async () => {
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const user = await UserService.getUserById(mockUserId);
      expect(user).toEqual(mockUser);
      expect(User.findById).toHaveBeenCalledWith(mockUserId);
    });

    it("should return null if user not found", async () => {
      (User.findById as jest.Mock).mockResolvedValue(null);
      const user = await UserService.getUserById(mockUserId);
      expect(user).toBeNull();
    });
  });

  describe("updateUser", () => {
    it("should update user data", async () => {
      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (User.findOne as jest.Mock).mockResolvedValue(null); // no duplicate email

      const updates = { username: "newname", email: "new@example.com" };
      const updatedUser = { ...mockUser, ...updates };

      mockUser.save.mockResolvedValue(updatedUser);

      const result = await UserService.updateUser(mockUserId, updates);
      expect(result).toEqual(updatedUser);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it("should throw error if user not found", async () => {
      (User.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        UserService.updateUser(mockUserId, { username: "newname" })
      ).rejects.toThrow(ApiError);
    });

    it("should throw error if email already in use", async () => {
      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (User.findOne as jest.Mock).mockResolvedValue({ email: "exists@example.com" });

      await expect(
        UserService.updateUser(mockUserId, { email: "exists@example.com" })
      ).rejects.toThrow(ApiError);
    });
  });

  describe("assignRole", () => {
    it("should assign role to user", async () => {
      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      mockUser.save.mockResolvedValue({ ...mockUser, role: ["group_admin"] });

      const result = await UserService.assignRole(mockUserId, UserRole.GROUP_ADMIN);
      expect(result.role).toEqual(["group_admin"]);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it("should throw error for invalid role", async () => {
      await expect(
        UserService.assignRole(mockUserId, "invalid_role" as any)
      ).rejects.toThrow(ApiError);
    });

    it("should throw error if user not found", async () => {
      (User.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        UserService.assignRole(mockUserId, UserRole.MEMBER)
      ).rejects.toThrow(ApiError);
    });
  });
    describe("searchUsers", () => {
        it("should return users matching query", async () => {
        const users = [mockUser, { ...mockUser, _id: new Types.ObjectId() }];
        (User.find as jest.Mock).mockReturnValue({
            limit: jest.fn().mockResolvedValue(users),
        });
    
        const result = await UserService.searchUsers("test");
        expect(result).toEqual(users);
        expect(User.find).toHaveBeenCalledWith({
            $or: [
            { username: { $regex: "test", $options: "i" } },
            { email: { $regex: "test", $options: "i" } },
            ],
        });
        });
    });
});
