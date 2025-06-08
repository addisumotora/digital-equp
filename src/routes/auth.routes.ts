import { Router } from 'express';
import AuthController from '../controllers/auth.controller';
import { validate } from '../middlewares/validation.middleware';
import { 
  registerSchema, 
  loginSchema 
} from '../validations/auth.validation';

const router = Router();

router.post('/register', validate(registerSchema), AuthController.register
);

router.post('/login', validate(loginSchema), AuthController.login);

router.get('/me', AuthController.getCurrentUser);

export default router;