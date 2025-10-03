import { Router } from 'express';
import adminController from '../controllers/admin.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.get(
    '/dashboard',
    authenticate,
    authorize('admin'),
    adminController.getDashboardStats
);

router.get(
    '/users',
    authenticate,
    authorize('admin'),
    adminController.getAllUsers
);

router.get(
    '/users/:userId',
    authenticate,
    authorize('admin'),
    adminController.getUserById
);

router.patch(
    '/users/:userId/role',
    authenticate,
    authorize('admin'),
    adminController.updateUserRole
);

router.delete(
    '/users/:userId',
    authenticate,
    authorize('admin'),
    adminController.deleteUser
);

export default router;
