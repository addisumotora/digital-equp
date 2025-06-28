import '../setup'; // Import database setup for integration tests
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import groupRoutes from '../../src/routes/group.routes';
import authRoutes from '../../src/routes/auth.routes';
import { errorHandler, errorConverter, notFound } from '../../src/middleware/error';
import { authenticate } from '../../src/middleware/auth';
import User from '../../src/models/user.model';
import EqubGroup from '../../src/models/group.model';
import Membership from '../../src/models/membership.model';
import { UserRole } from '../../src/types/types';

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/groups', authenticate, groupRoutes);
  app.use(notFound);
  app.use(errorConverter);
  app.use(errorHandler);
  return app;
};

describe('Group Integration Tests', () => {
  let app: express.Application;
  let memberToken: string;
  let groupAdminToken: string;
  let superAdminToken: string;
  let memberId: string;
  let groupAdminId: string;
  let superAdminId: string;
  let groupId: string;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await EqubGroup.deleteMany({});
    await Membership.deleteMany({});

    // Create member user
    const memberData = {
      username: 'member',
      email: 'member@example.com',
      password: 'Password123!',
      passwordConfirm: 'Password123!'
    };

    const memberResponse = await request(app)
      .post('/api/v1/auth/register')
      .send(memberData);

    memberToken = memberResponse.body.data.token;
    memberId = memberResponse.body.data.user._id;

    // Create group admin user
    const groupAdminData = {
      username: 'groupadmin',
      email: 'groupadmin@example.com',
      password: 'Password123!',
      passwordConfirm: 'Password123!'
    };

    const groupAdminResponse = await request(app)
      .post('/api/v1/auth/register')
      .send(groupAdminData);

    groupAdminId = groupAdminResponse.body.data.user._id;

    // Set group admin role
    await User.findByIdAndUpdate(groupAdminId, { role: [UserRole.GROUP_ADMIN] });

    // Login again to get token with updated role
    const groupAdminLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'groupadmin@example.com',
        password: 'Password123!'
      });

    groupAdminToken = groupAdminLoginResponse.body.data.token;

    // Create super admin user
    const superAdminData = {
      username: 'superadmin',
      email: 'superadmin@example.com',
      password: 'Password123!',
      passwordConfirm: 'Password123!'
    };

    const superAdminResponse = await request(app)
      .post('/api/v1/auth/register')
      .send(superAdminData);

    superAdminId = superAdminResponse.body.data.user._id;

    // Set super admin role
    await User.findByIdAndUpdate(superAdminId, { role: [UserRole.SUPER_ADMIN] });

    // Login again to get token with updated role
    const superAdminLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'superadmin@example.com',
        password: 'Password123!'
      });

    superAdminToken = superAdminLoginResponse.body.data.token;
  });

  describe('POST /api/v1/groups', () => {
    it('should allow super admin to create group', async () => {
      const groupData = {
        name: 'Test Equb Group',
        description: 'A test group for integration testing',
        amount: 1000,
        cycleDuration: 30
      };

      const response = await request(app)
        .post('/api/v1/groups')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(groupData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(groupData.name);
      expect(response.body.data.amount).toBe(groupData.amount);
      expect(response.body.data.creator).toBe(superAdminId);
      expect(response.body.data.members).toContain(superAdminId);
      expect(response.body.message).toBe('Group created successfully');

      groupId = response.body.data._id;

      // Verify membership was created
      const membership = await Membership.findOne({ user: superAdminId, group: groupId });
      expect(membership).not.toBeNull();
    });

    it('should not allow member to create group', async () => {
      const groupData = {
        name: 'Test Group',
        amount: 1000,
        cycleDuration: 30
      };

      const response = await request(app)
        .post('/api/v1/groups')
        .set('Authorization', `Bearer ${memberToken}`)
        .send(groupData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });

    it('should validate group data', async () => {
      const invalidGroupData = {
        name: 'Ab', // Too short
        amount: -100, // Negative amount
        cycleDuration: 0 // Invalid duration
      };

      const response = await request(app)
        .post('/api/v1/groups')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(invalidGroupData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation error');
    });
  });

  describe('POST /api/v1/groups/:id/join', () => {
    beforeEach(async () => {
      // Create a test group
      const group = await EqubGroup.create({
        name: 'Test Group',
        creator: superAdminId,
        amount: 1000,
        cycleDuration: 30,
        members: [superAdminId]
      });
      groupId = (group._id as any).toString();

      await Membership.create({
        user: superAdminId,
        group: groupId
      });
    });

    it('should allow user to join group', async () => {
      const response = await request(app)
        .post(`/api/v1/groups/${groupId}/join`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.members).toContain(memberId);
      expect(response.body.message).toBe('Successfully joined group');

      // Verify membership was created
      const membership = await Membership.findOne({ user: memberId, group: groupId });
      expect(membership).not.toBeNull();
    });

    it('should not allow user to join same group twice', async () => {
      // First join
      await request(app)
        .post(`/api/v1/groups/${groupId}/join`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      // Second join attempt
      const response = await request(app)
        .post(`/api/v1/groups/${groupId}/join`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User already in group');
    });

    it('should return 404 for non-existent group', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post(`/api/v1/groups/${nonExistentId}/join`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Group not found');
    });
  });

  describe('GET /api/v1/groups/:id', () => {
    beforeEach(async () => {
      const group = await EqubGroup.create({
        name: 'Test Group',
        description: 'Test Description',
        creator: superAdminId,
        amount: 1000,
        cycleDuration: 30,
        members: [superAdminId, memberId]
      });
      groupId = (group._id as any).toString();
    });

    it('should get group details', async () => {
      const response = await request(app)
        .get(`/api/v1/groups/${groupId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Group');
      expect(response.body.data.amount).toBe(1000);
      expect(response.body.data.members.length).toBe(2);
    });

    it('should return 404 for non-existent group', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/v1/groups/${nonExistentId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Group not found');
    });
  });

  describe('GET /api/v1/groups', () => {
    beforeEach(async () => {
      await EqubGroup.create([
        {
          name: 'Group 1',
          creator: superAdminId,
          amount: 1000,
          cycleDuration: 30,
          members: [superAdminId]
        },
        {
          name: 'Group 2',
          creator: groupAdminId,
          amount: 2000,
          cycleDuration: 45,
          members: [groupAdminId]
        }
      ]);
    });

    it('should get all groups', async () => {
      const response = await request(app)
        .get('/api/v1/groups')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(2);
    });
  });

  describe('GET /api/v1/groups/:userId/user-groups', () => {
    beforeEach(async () => {
      await EqubGroup.create([
        {
          name: 'Member Group',
          creator: superAdminId,
          amount: 1000,
          cycleDuration: 30,
          members: [superAdminId, memberId]
        },
        {
          name: 'Admin Group',
          creator: groupAdminId,
          amount: 2000,
          cycleDuration: 45,
          members: [groupAdminId],
          admin: groupAdminId
        }
      ]);
    });

    it('should get user groups', async () => {
      const response = await request(app)
        .get(`/api/v1/groups/${memberId}/user-groups`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].name).toBe('Member Group');
    });
  });

  describe('PATCH /api/v1/groups/:id/assign-admin', () => {
    beforeEach(async () => {
      const group = await EqubGroup.create({
        name: 'Test Group',
        creator: superAdminId,
        amount: 1000,
        cycleDuration: 30,
        members: [superAdminId, groupAdminId],
        admin: groupAdminId
      });
      groupId = (group._id as any).toString();
    });

    it('should allow super admin to assign group admin', async () => {
      const adminData = {
        userId: groupAdminId
      };

      const response = await request(app)
        .patch(`/api/v1/groups/${groupId}/assign-admin`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(adminData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.admin).toBe(groupAdminId);
      expect(response.body.message).toBe('Admin assigned successfully');
    });

    it('should not allow member to assign admin', async () => {
      const adminData = {
        userId: groupAdminId
      };

      const response = await request(app)
        .patch(`/api/v1/groups/${groupId}/assign-admin`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send(adminData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('PATCH /api/v1/groups/:id/remove-admin', () => {
    beforeEach(async () => {
      const group = await EqubGroup.create({
        name: 'Test Group',
        creator: superAdminId,
        amount: 1000,
        cycleDuration: 30,
        members: [superAdminId, groupAdminId],
        admin: groupAdminId
      });
      groupId = (group._id as any).toString();
    });

    it('should allow super admin to remove group admin', async () => {
      const adminData = {
        userId: groupAdminId
      };

      const response = await request(app)
        .patch(`/api/v1/groups/${groupId}/remove-admin`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(adminData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.admin).toBeNull();
      expect(response.body.message).toBe('Admin removed successfully');
    });
  });

  describe('PATCH /api/v1/groups/:id/remove-user', () => {
    beforeEach(async () => {
      const group = await EqubGroup.create({
        name: 'Test Group',
        creator: superAdminId,
        amount: 1000,
        cycleDuration: 30,
        members: [superAdminId, memberId],
        admin: superAdminId
      });
      groupId = (group._id as any).toString();

      // Create membership
      await Membership.create({
        user: memberId,
        group: groupId
      });
    });

    it('should allow group admin to remove user', async () => {
      const userData = {
        userId: memberId
      };

      const response = await request(app)
        .patch(`/api/v1/groups/${groupId}/remove-user`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(userData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.members).not.toContain(memberId);
      expect(response.body.message).toBe('User removed from group successfully');

      // Verify membership was deleted
      const membership = await Membership.findOne({ user: memberId, group: groupId });
      expect(membership).toBeNull();
    });

    it('should not allow member to remove other users', async () => {
      const userData = {
        userId: superAdminId
      };

      const response = await request(app)
        .patch(`/api/v1/groups/${groupId}/remove-user`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send(userData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('POST /api/v1/groups/:id/rotate', () => {
    beforeEach(async () => {
      const group = await EqubGroup.create({
        name: 'Test Group',
        creator: superAdminId,
        amount: 1000,
        cycleDuration: 30,
        members: [superAdminId, memberId],
        admin: superAdminId
      });
      groupId = (group._id as any).toString();
    });

    it('should allow group admin to rotate payout', async () => {
      const response = await request(app)
        .post(`/api/v1/groups/${groupId}/rotate`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.currentWinner).toBeDefined();
      expect(response.body.data.currentCycle).toBe(2);
      expect(response.body.message).toBe('Payout rotated successfully');
    });

    it('should not allow member to rotate payout', async () => {
      const response = await request(app)
        .post(`/api/v1/groups/${groupId}/rotate`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('DELETE /api/v1/groups/:id', () => {
    beforeEach(async () => {
      const group = await EqubGroup.create({
        name: 'Test Group',
        creator: superAdminId,
        amount: 1000,
        cycleDuration: 30,
        members: [superAdminId],
        admin: superAdminId
      });
      groupId = (group._id as any).toString();

      await Membership.create({
        user: superAdminId,
        group: groupId
      });
    });

    it('should allow super admin to delete group', async () => {
      const response = await request(app)
        .delete(`/api/v1/groups/${groupId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Group deleted successfully');

      // Verify group was deleted
      const deletedGroup = await EqubGroup.findById(groupId);
      expect(deletedGroup).toBeNull();

      // Verify memberships were deleted
      const memberships = await Membership.find({ group: groupId });
      expect(memberships).toHaveLength(0);
    });

    it('should not allow member to delete group', async () => {
      const response = await request(app)
        .delete(`/api/v1/groups/${groupId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });

    it('should return 404 for non-existent group', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/v1/groups/${nonExistentId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Group not found');
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for all routes', async () => {
      const routes = [
        { method: 'get' as const, path: '/api/v1/groups' },
        { method: 'post' as const, path: '/api/v1/groups' },
        { method: 'get' as const, path: `/api/v1/groups/${new mongoose.Types.ObjectId()}` }
      ];

      for (const route of routes) {
        const response = await (request(app) as any)[route.method](route.path).expect(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Authentication required');
      }
    });

    it('should reject invalid tokens', async () => {
      const response = await request(app)
        .get('/api/v1/groups')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired token');
    });
  });
}); 