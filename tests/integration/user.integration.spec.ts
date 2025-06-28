import '../setup'; // Import database setup for integration tests
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import userRoutes from '../../src/routes/user.routes';
import authRoutes from '../../src/routes/auth.routes';
import { errorHandler, errorConverter, notFound } from '../../src/middleware/error';
import { authenticate } from '../../src/middleware/auth';
import User from '../../src/models/user.model';
import { UserRole } from '../../src/types/types';

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', authenticate, userRoutes);
  app.use(notFound);
  app.use(errorConverter);
  app.use(errorHandler);
  return app;
};

describe('User Integration Tests', () => {
  let app: express.Application;
  let userToken: string;
  let superAdminToken: string;
  let userId: string;
  let superAdminId: string;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(async () => {
    await User.deleteMany({});

    // Create regular user and get token
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!',
      passwordConfirm: 'Password123!'
    };

    const userResponse = await request(app)
      .post('/api/v1/auth/register')
      .send(userData);

    userToken = userResponse.body.data.token;
    userId = userResponse.body.data.user._id;

    // Create super admin user
    const superAdminData = {
      username: 'superadmin',
      email: 'admin@example.com',
      password: 'AdminPass123!',
      passwordConfirm: 'AdminPass123!'
    };

    const adminResponse = await request(app)
      .post('/api/v1/auth/register')
      .send(superAdminData);

    superAdminId = adminResponse.body.data.user._id;

    // Manually set super admin role
    await User.findByIdAndUpdate(superAdminId, { role: [UserRole.SUPER_ADMIN] });
    
    // Login again to get token with updated role
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'AdminPass123!'
      });

    superAdminToken = loginResponse.body.data.token;
  });

  describe('GET /api/v1/users', () => {
    it('should get all users when authenticated', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(2); // testuser and superadmin
    });

    it('should not get users without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Authentication required');
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should get user profile by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(userId);
      expect(response.body.data.username).toBe('testuser');
      expect(response.body.data.email).toBe('test@example.com');
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/v1/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('PATCH /api/v1/users/:id', () => {
    it('should update user profile', async () => {
      const updateData = {
        username: 'updateduser',
        email: 'updated@example.com'
      };

      const response = await request(app)
        .patch(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe('updateduser');
      expect(response.body.data.email).toBe('updated@example.com');
      expect(response.body.message).toBe('Profile updated successfully');
    });

    it('should not allow duplicate email', async () => {
      const updateData = {
        email: 'admin@example.com' // Super admin's email
      };

      const response = await request(app)
        .patch(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email already in use');
    });
  });

  describe('GET /api/v1/users/search', () => {
    beforeEach(async () => {
      // Create additional test users
      await User.create({
        username: 'john_doe',
        email: 'john@example.com',
        password: 'password123',
        role: [UserRole.MEMBER]
      });

      await User.create({
        username: 'jane_smith',
        email: 'jane@example.com',
        password: 'password123',
        role: [UserRole.GROUP_ADMIN]
      });
    });

    it('should search users by username', async () => {
      const response = await request(app)
        .get('/api/v1/users/search?q=john')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].username).toBe('john_doe');
    });

    it('should search users by email', async () => {
      const response = await request(app)
        .get('/api/v1/users/search?q=jane@example')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].email).toBe('jane@example.com');
    });

    it('should return empty array for no matches', async () => {
      const response = await request(app)
        .get('/api/v1/users/search?q=nonexistent')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('PATCH /api/v1/users/:id/assign-role', () => {
    it('should allow super admin to assign roles', async () => {
      const roleData = {
        role: UserRole.GROUP_ADMIN
      };

      const response = await request(app)
        .patch(`/api/v1/users/${userId}/assign-role`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(roleData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toEqual([UserRole.GROUP_ADMIN]);
      expect(response.body.message).toBe('Role assigned successfully');
    });

    it('should not allow regular user to assign roles', async () => {
      const roleData = {
        role: UserRole.GROUP_ADMIN
      };

      const response = await request(app)
        .patch(`/api/v1/users/${userId}/assign-role`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(roleData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });

    it('should reject invalid role', async () => {
      const roleData = {
        role: 'invalid_role'
      };

      const response = await request(app)
        .patch(`/api/v1/users/${userId}/assign-role`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(roleData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid role specified');
    });
  });

  describe('PATCH /api/v1/users/:id/remove-role', () => {
    beforeEach(async () => {
      // Set user to have group admin role
      await User.findByIdAndUpdate(userId, { role: [UserRole.MEMBER, UserRole.GROUP_ADMIN] });
    });

    it('should remove role from user', async () => {
      const roleData = {
        role: UserRole.GROUP_ADMIN
      };

      const response = await request(app)
        .patch(`/api/v1/users/${userId}/remove-role`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(roleData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toEqual([UserRole.MEMBER]);
      expect(response.body.message).toBe('Role removed successfully');
    });

    it('should handle missing parameters', async () => {
      const response = await request(app)
        .patch(`/api/v1/users/${userId}/remove-role`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User ID and role are required');
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('should allow super admin to delete users', async () => {
      const response = await request(app)
        .delete(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(204);

      // Verify user was deleted
      const deletedUser = await User.findById(userId);
      expect(deletedUser).toBeNull();
    });

    it('should not allow regular user to delete users', async () => {
      const response = await request(app)
        .delete(`/api/v1/users/${superAdminId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/v1/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for all routes', async () => {
      const routes = [
        { method: 'get' as const, path: '/api/v1/users' },
        { method: 'get' as const, path: `/api/v1/users/${userId}` },
        { method: 'patch' as const, path: `/api/v1/users/${userId}` },
        { method: 'delete' as const, path: `/api/v1/users/${userId}` }
      ];

      for (const route of routes) {
        const response = await (request(app) as any)[route.method](route.path).expect(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Authentication required');
      }
    });

    it('should reject invalid tokens', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired token');
    });
  });
}); 