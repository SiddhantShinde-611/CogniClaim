import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';
import { listUsers, createUser, updateUserRole, assignManager } from '../controllers/user.controller';

const router = Router();

router.use(authenticate);

router.get('/', requireAdmin, listUsers);
router.post('/', requireAdmin, createUser);
router.patch('/:id/role', requireAdmin, updateUserRole);
router.patch('/:id/manager', requireAdmin, assignManager);

export { router as userRoutes };
