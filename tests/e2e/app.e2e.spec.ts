import '../setup'; // Import database setup for E2E tests
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import config from '../../src/config/config';
import authRoutes from '../../src/routes/auth.routes';
import userRoutes from '../../src/routes/user.routes';
import groupRoutes from '../../src/routes/group.routes';
import paymentRoutes from '../../src/routes/payment.routes';
import { errorHandler, errorConverter, notFound } from '../../src/middleware/error';
import { authenticate } from '../../src/middleware/auth';

// Create test app that mimics the real app
const createTestApp = () => {
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(express.json());

  // Routes
  app.use(config.api.prefix + "/auth", authRoutes);
  app.use(config.api.prefix + "/users", authenticate, userRoutes);
  app.use(config.api.prefix + "/groups", authenticate, groupRoutes);
  app.use(config.api.prefix + "/payments", authenticate, paymentRoutes);

  // 404 handler for unknown routes
  app.use(notFound);
  
  // Error handling
  app.use(errorConverter);
  app.use(errorHandler);
  
  return app;
};

describe('App E2E Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('Complete User Flow', () => {
    let userToken: string;
    let userId: string;
    let groupId: string;

    it('should complete a full user journey', async () => {
      // 1. Register a new user
      const userData = {
        username: 'e2euser',
        email: 'e2e@example.com',
        password: 'Password123!',
        passwordConfirm: 'Password123!'
      };

      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      userToken = registerResponse.body.data.token;
      userId = registerResponse.body.data.user._id;

      // 2. Login with the registered user
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);

      // 3. Get current user
      const meResponse = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(meResponse.body.data.email).toBe(userData.email);

      // 4. Update user profile
      const updateResponse = await request(app)
        .patch(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          username: 'updateduser'
        })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);

      // 5. Get all groups (should be empty)
      const groupsResponse = await request(app)
        .get('/api/v1/groups')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(groupsResponse.body.data).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/v1/unknown-route')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Not found');
    });

    it('should handle unauthorized access', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Authentication required');
    });

    it('should handle invalid JSON', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Health and Status', () => {
    it('should handle preflight OPTIONS requests', async () => {
      const response = await request(app)
        .options('/api/v1/auth/login')
        .expect(204);

      // Should include CORS headers
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });
}); 