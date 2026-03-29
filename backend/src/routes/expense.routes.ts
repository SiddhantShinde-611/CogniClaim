import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin, requireManager, requireEmployee } from '../middleware/role.middleware';
import {
  submitExpense,
  getMyExpenses,
  getPendingExpenses,
  getAllExpenses,
  approveExpense,
  rejectExpense,
  ocrReceipt,
  getExpenseAudit,
} from '../controllers/expense.controller';

const router = Router();

router.use(authenticate);

router.post('/', requireEmployee, submitExpense);
router.get('/me', requireEmployee, getMyExpenses);
router.get('/pending', requireManager, getPendingExpenses);
router.get('/', requireAdmin, getAllExpenses);
router.patch('/:id/approve', requireManager, approveExpense);
router.patch('/:id/reject', requireManager, rejectExpense);
router.post('/ocr', requireEmployee, ocrReceipt);
router.get('/:id/audit', requireAdmin, getExpenseAudit);

export { router as expenseRoutes };
