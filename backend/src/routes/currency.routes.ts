import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getCurrencies } from '../controllers/currency.controller';

const router = Router();

router.use(authenticate);
router.get('/', getCurrencies);

export { router as currencyRoutes };
