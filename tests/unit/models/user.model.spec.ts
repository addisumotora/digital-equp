import '../../setup'; // Import database setup for model tests
import mongoose from 'mongoose';
import User from '../../../src/models/user.model';
import { UserRole } from '../../../src/types/types';

describe('User Model', () => {
  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('User Schema Validation', () => {
    it('should create a valid user', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: [UserRole.MEMBER]
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.username).toBe(userData.username);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.role).toEqual([UserRole.MEMBER]);
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
    });

    it('should set default role to member', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.role).toEqual([UserRole.MEMBER]);
    });

    it('should require username', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow();
    });

    it('should require email', async () => {
      const userData = {
        username: 'testuser',
        password: 'password123'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow();
    });

    it('should require password', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow();
    });

    it('should enforce unique username', async () => {
      const userData1 = {
        username: 'testuser',
        email: 'test1@example.com',
        password: 'password123'
      };

      const userData2 = {
        username: 'testuser',
        email: 'test2@example.com',
        password: 'password123'
      };

      const user1 = new User(userData1);
      await user1.save();

      const user2 = new User(userData2);
      await expect(user2.save()).rejects.toThrow();
    });

    it('should enforce unique email', async () => {
      const userData1 = {
        username: 'testuser1',
        email: 'test@example.com',
        password: 'password123'
      };

      const userData2 = {
        username: 'testuser2',
        email: 'test@example.com',
        password: 'password123'
      };

      const user1 = new User(userData1);
      await user1.save();

      const user2 = new User(userData2);
      await expect(user2.save()).rejects.toThrow();
    });

    it('should validate role enum values', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: ['invalid_role']
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    it('should allow multiple valid roles', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: [UserRole.MEMBER, UserRole.GROUP_ADMIN]
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.role).toEqual([UserRole.MEMBER, UserRole.GROUP_ADMIN]);
    });
  });

  describe('Bank Account Schema', () => {
    it('should save user with bank account', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        bankAccount: {
          accountNumber: '1234567890',
          bankName: 'Test Bank',
          accountHolder: 'Test User'
        }
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.bankAccount).toBeDefined();
      expect(savedUser.bankAccount?.accountNumber).toBe('1234567890');
      expect(savedUser.bankAccount?.bankName).toBe('Test Bank');
      expect(savedUser.bankAccount?.accountHolder).toBe('Test User');
    });

    it('should save user without bank account', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.bankAccount).toBeUndefined();
    });

    it('should require all bank account fields if provided', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        bankAccount: {
          accountNumber: '1234567890',
          bankName: 'Test Bank'
          // Missing accountHolder
        }
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('Password Hashing', () => {
    it('should hash password before saving', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'plainpassword'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.password).not.toBe('plainpassword');
      expect(savedUser.password).toMatch(/^\$2[ayb]\$[0-9]{2}\$[A-Za-z0-9./]{53}$/); // bcrypt format
    });

    it('should not hash password if not modified', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'plainpassword'
      };

      const user = new User(userData);
      const savedUser = await user.save();
      const originalPassword = savedUser.password;

      // Update without changing password
      savedUser.username = 'updateduser';
      const updatedUser = await savedUser.save();

      expect(updatedUser.password).toBe(originalPassword);
    });

    it('should hash password when modified', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'plainpassword'
      };

      const user = new User(userData);
      const savedUser = await user.save();
      const originalPassword = savedUser.password;

      // Update password
      savedUser.password = 'newpassword';
      const updatedUser = await savedUser.save();

      expect(updatedUser.password).not.toBe(originalPassword);
      expect(updatedUser.password).not.toBe('newpassword');
    });
  });

  describe('comparePassword method', () => {
    let user: any;

    beforeEach(async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'testpassword123'
      };

      user = new User(userData);
      await user.save();
    });

    it('should return true for correct password', async () => {
      const isMatch = await user.comparePassword('testpassword123');
      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const isMatch = await user.comparePassword('wrongpassword');
      expect(isMatch).toBe(false);
    });

    it('should return false for empty password', async () => {
      const isMatch = await user.comparePassword('');
      expect(isMatch).toBe(false);
    });

    it('should handle special characters in password', async () => {
      const userData = {
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'p@ssw0rd!@#$%^&*()'
      };

      const specialUser = new User(userData);
      await specialUser.save();

      const isMatch = await specialUser.comparePassword('p@ssw0rd!@#$%^&*()');
      expect(isMatch).toBe(true);
    });
  });

  describe('Schema options', () => {
    it('should exclude password by default when selecting', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'plainpassword'
      };

      const user = new User(userData);
      await user.save();

      const foundUser = await User.findOne({ username: 'testuser' });
      
      expect(foundUser?.password).toBeUndefined();
    });

    it('should include password when explicitly selected', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'plainpassword'
      };

      const user = new User(userData);
      await user.save();

      const foundUser = await User.findOne({ username: 'testuser' }).select('+password');
      
      expect(foundUser?.password).toBeDefined();
      expect(foundUser?.password).not.toBe('plainpassword'); // Should be hashed
    });

    it('should not have versionKey', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'plainpassword'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect((savedUser as any).__v).toBeUndefined();
    });

    it('should have timestamps', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'plainpassword'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.createdAt).toBeInstanceOf(Date);
      expect(savedUser.updatedAt).toBeInstanceOf(Date);
    });
  });
}); 