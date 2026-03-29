import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient, Role } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { z } from 'zod';

const prisma = new PrismaClient();

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE']).default('EMPLOYEE'),
  manager_id: z.string().optional(),
  is_manager_approver: z.boolean().default(false),
});

export const listUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      where: { company_id: req.user!.company_id },
      select: {
        id: true,
        email: true,
        role: true,
        manager_id: true,
        is_manager_approver: true,
        created_at: true,
        manager: { select: { id: true, email: true } },
      },
      orderBy: { created_at: 'asc' },
    });

    res.json({ success: true, data: users });
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
};

export const createUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    const { email, password, role, manager_id, is_manager_approver } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ success: false, error: 'Email already in use' });
      return;
    }

    if (manager_id) {
      const manager = await prisma.user.findFirst({
        where: { id: manager_id, company_id: req.user!.company_id },
      });
      if (!manager) {
        res.status(400).json({ success: false, error: 'Manager not found in company' });
        return;
      }
    }

    const password_hash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        password_hash,
        role: role as Role,
        company_id: req.user!.company_id,
        manager_id: manager_id || null,
        is_manager_approver,
      },
      select: {
        id: true,
        email: true,
        role: true,
        manager_id: true,
        is_manager_approver: true,
        created_at: true,
      },
    });

    res.status(201).json({ success: true, data: user });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
};

export const updateUserRole = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(role)) {
      res.status(400).json({ success: false, error: 'Invalid role' });
      return;
    }

    const target = await prisma.user.findFirst({
      where: { id, company_id: req.user!.company_id },
    });
    if (!target) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role: role as Role },
      select: { id: true, email: true, role: true },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Update role error:', err);
    res.status(500).json({ success: false, error: 'Failed to update role' });
  }
};

export const assignManager = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { manager_id, is_manager_approver } = req.body;

    const target = await prisma.user.findFirst({
      where: { id, company_id: req.user!.company_id },
    });
    if (!target) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    if (manager_id) {
      const manager = await prisma.user.findFirst({
        where: { id: manager_id, company_id: req.user!.company_id },
      });
      if (!manager) {
        res.status(400).json({ success: false, error: 'Manager not found in company' });
        return;
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        manager_id: manager_id || null,
        is_manager_approver: is_manager_approver ?? target.is_manager_approver,
      },
      select: { id: true, email: true, role: true, manager_id: true, is_manager_approver: true },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Assign manager error:', err);
    res.status(500).json({ success: false, error: 'Failed to assign manager' });
  }
};
