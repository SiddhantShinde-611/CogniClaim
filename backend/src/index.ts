import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRoutes } from './routes/auth.routes';
import { expenseRoutes } from './routes/expense.routes';
import { approvalRoutes } from './routes/approval.routes';
import { userRoutes } from './routes/user.routes';
import { currencyRoutes } from './routes/currency.routes';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://cogniclaim-app.vercel.app',
  'https://cogniclaim.onrender.com',
  /^https:\/\/cogniclaim.*\.vercel\.app$/,
  /^https:\/\/frontend.*\.vercel\.app$/,
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow server-to-server / curl
    const allowed = allowedOrigins.some((o) =>
      typeof o === 'string' ? o === origin : o.test(origin)
    );
    callback(null, allowed);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', app: 'CogniClaim API', timestamp: new Date().toISOString() } });
});

// Temporary debug
app.get('/debug', async (_req, res) => {
  const { prisma } = await import('./lib/prisma');
  const bcrypt = await import('bcryptjs');
  const jwt = await import('jsonwebtoken');
  const steps: any = {};
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@nexussolut.demo' },
      include: { company: true },
    });
    steps.user_found = !!user;
    steps.has_hash = !!user?.password_hash;
    steps.hash_preview = user?.password_hash?.slice(0, 10);
    if (user) {
      const valid = await bcrypt.default.compare('Demo@1234', user.password_hash);
      steps.password_valid = valid;
      if (valid) {
        const token = jwt.default.sign({ id: user.id }, process.env.JWT_SECRET!);
        steps.token_generated = !!token;
      }
    }
  } catch (e: any) {
    steps.error = e?.message || String(e);
  }
  res.json(steps);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/users', userRoutes);
app.use('/api/currencies', currencyRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`CogniClaim API running on http://localhost:${PORT}`);
});

export default app;
