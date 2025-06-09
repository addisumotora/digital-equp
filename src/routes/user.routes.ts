import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import userController from '../controllers/user.controller';


const router = Router();

router.use(authenticate);

router.get('/profile', userController.getUserProfile);
router.patch('/profile/:id', userController.updateUserProfile);
router.get('/search', userController.searchUsers);
router.patch('/:id/assign-role', authorize('super_admin'), userController.assignRole);
router.delete('/profile/:id', authorize('super_admin'), userController.deleteUser);
router.get('/all', userController.getAllUsers);
router.get('/role/:role', userController.getUserByRole);

export default router;