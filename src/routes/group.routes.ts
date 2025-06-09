import { Router } from 'express';
import GroupController from '../controllers/group.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createGroupSchema, joinGroupSchema } from '../validations/group.validation';

const router = Router();

router.use(authenticate);

router.post('/', authorize('super_admin'), validate(createGroupSchema), GroupController.createGroup);
router.post('/:id/join', validate(joinGroupSchema), GroupController.joinGroup);
router.get('/:id', GroupController.getGroup);
router.get('/:userId/user-groups', GroupController.getUserGroups);
router.get('/', GroupController.getAllGroups);
router.post('/:id/rotate', authorize('group_admin', 'super_admin'), GroupController.rotatePayout);
router.patch('/:id/assign-admin', authorize('super_admin', 'group_admin'), GroupController.assignAdmin);
router.patch('/:id/remove-admin', authorize('super_admin', 'group_admin'), GroupController.removeAdmin);
router.patch('/:id/remove-user', authorize('super_admin', 'group_admin'), GroupController.removeUserFromGroup);

// Only super_admin or group_admin can delete a group
router.delete('/:id', authorize('super_admin', 'group_admin'), GroupController.deleteGroup);

export default router;