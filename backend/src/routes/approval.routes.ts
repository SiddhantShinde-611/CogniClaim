import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';
import { createPolicy, listPolicies } from '../controllers/approval.controller';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.post('/policies', createPolicy);
router.get('/policies', listPolicies);

export { router as approvalRoutes };
