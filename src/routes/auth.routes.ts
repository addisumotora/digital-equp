import { Router } from 'express';
import AuthController from '../controllers/auth.controller';
import { validate } from '../middleware/validation';
import { loginSchema, registerSchema } from '../validations/auth.validation';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', validate(registerSchema), AuthController.register);

router.post('/login', validate(loginSchema), AuthController.login);

router.get('/me', authenticate, AuthController.getCurrentUser);

export default router;