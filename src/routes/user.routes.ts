import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import userController from '../controllers/user.controller';


const router = Router();

router.use(authenticate);

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserProfile);
router.get('/search', userController.searchUsers);
router.patch('/:id', userController.updateUserProfile);
router.patch('/:id/assign-role', authorize('super_admin'), userController.assignRole);
router.patch("/:id/remove-role", userController.removeRole)
router.delete('/:id', authorize('super_admin'), userController.deleteUser);

export default router;