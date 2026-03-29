import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { signup, login, refresh, logout } from '../controllers/auth.controller';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  message: { success: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', logout);

export { router as authRoutes };
