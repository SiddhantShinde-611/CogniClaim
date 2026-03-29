import { Response } from 'express';
import { Role } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const createPolicySchema = z.object({
  name: z.string().min(1),
  rule_type: z.enum(['SEQUENTIAL', 'PERCENTAGE', 'SPECIFIC', 'HYBRID']),
  percentage_threshold: z.number().min(0).max(100).optional(),
  specific_approver_id: z.string().optional(),
  steps: z.array(
    z.object({
      step_order: z.number().int().positive(),
      approver_role: z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE']).optional(),
      approver_user_id: z.string().optional(),
    })
  ),
});

export const createPolicy = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parsed = createPolicySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    const { name, rule_type, percentage_threshold, specific_approver_id, steps } = parsed.data;

    const policy = await prisma.approvalPolicy.create({
      data: {
        company_id: req.user!.company_id,
        name,
        rule_type,
        percentage_threshold: percentage_threshold ?? null,
        specific_approver_id: specific_approver_id || null,
        steps: {
          create: steps.map((s) => ({
            step_order: s.step_order,
            approver_role: s.approver_role as Role | undefined ?? null,
            approver_user_id: s.approver_user_id || null,
          })),
        },
      },
      include: { steps: { orderBy: { step_order: 'asc' } } },
    });

    res.status(201).json({ success: true, data: policy });
  } catch (err) {
    console.error('Create policy error:', err);
    res.status(500).json({ success: false, error: 'Failed to create policy' });
  }
};

export const listPolicies = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const policies = await prisma.approvalPolicy.findMany({
      where: { company_id: req.user!.company_id },
      include: {
        steps: {
          orderBy: { step_order: 'asc' },
          include: {
            specific_approver: { select: { id: true, email: true } },
          },
        },
        specific_approver: { select: { id: true, email: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: policies });
  } catch (err) {
    console.error('List policies error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch policies' });
  }
};
