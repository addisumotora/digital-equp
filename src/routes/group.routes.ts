import { Router } from 'express';
import GroupController from '../controllers/group.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { 
  createGroupSchema,
  joinGroupSchema
} from '../validations/group.validation';

const router = Router();

// Apply authentication middleware to all group routes
router.use(authenticate);

router.post(
  '/',
  validate(createGroupSchema),
  GroupController.createGroup
);

router.post(
  '/:id/join',
  validate(joinGroupSchema),
  GroupController.joinGroup
);

router.get(
  '/:id',
  GroupController.getGroupDetails
);

router.post(
  '/:id/rotate',
  GroupController.rotatePayout
);

export default router;