import { Router } from 'express';
import GroupController from '../controllers/group.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createGroupSchema, joinGroupSchema } from '../validations/group.validation';

const router = Router();

router.use(authenticate);

router.post('/', validate(createGroupSchema), GroupController.createGroup);
router.post('/:id/join', validate(joinGroupSchema), GroupController.joinGroup);
// router.get('/:id', GroupController.getGroupDetails);
router.post('/:id/rotate', GroupController.rotatePayout);

export default router;