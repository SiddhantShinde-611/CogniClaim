import { Response } from 'express';
import { PrismaClient, ExpenseStatus } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { initiateApprovalWorkflow, processApproval } from '../services/approval.service';
import { convertAmount } from '../services/currency.service';
import { extractReceiptData } from '../services/ocr.service';
import { z } from 'zod';

const prisma = new PrismaClient();

const submitExpenseSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3),
  category: z.string().min(1),
  description: z.string().min(1),
  expense_date: z.string(),
  merchant_name: z.string().optional(),
  receipt_url: z.string().optional(),
});

async function createAuditLog(
  expenseId: string,
  actorId: string,
  action: string,
  metadata: Record<string, unknown>,
  ipAddress?: string
) {
  await prisma.auditLog.create({
    data: {
      expense_id: expenseId,
      actor_id: actorId,
      action,
      metadata: metadata as any,
      ip_address: ipAddress || null,
    },
  });
}

export const submitExpense = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parsed = submitExpenseSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    const { amount, currency, category, description, expense_date, merchant_name, receipt_url } = parsed.data;

    const employee = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { company: true },
    });
    if (!employee) {
      res.status(404).json({ success: false, error: 'Employee not found' });
      return;
    }

    const baseCurrency = employee.company.currency_code;
    let converted_amount: number | null = null;
    try {
      converted_amount = await convertAmount(amount, currency, baseCurrency);
    } catch {
      converted_amount = null;
    }

    const expense = await prisma.expense.create({
      data: {
        employee_id: req.user!.id,
        amount,
        currency,
        converted_amount,
        base_currency: baseCurrency,
        category,
        description,
        expense_date: new Date(expense_date),
        merchant_name: merchant_name || null,
        receipt_url: receipt_url || null,
        status: ExpenseStatus.PENDING,
      },
    });

    await createAuditLog(
      expense.id,
      req.user!.id,
      'SUBMITTED',
      { amount, currency, category, merchant_name },
      req.ip
    );

    await initiateApprovalWorkflow(expense.id, req.user!.id, req.user!.company_id);

    const updated = await prisma.expense.findUnique({ where: { id: expense.id } });
    res.status(201).json({ success: true, data: updated });
  } catch (err) {
    console.error('Submit expense error:', err);
    res.status(500).json({ success: false, error: 'Failed to submit expense' });
  }
};

export const getMyExpenses = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const expenses = await prisma.expense.findMany({
      where: { employee_id: req.user!.id },
      orderBy: { created_at: 'desc' },
      include: {
        approval_requests: {
          include: { approver: { select: { id: true, email: true } } },
          orderBy: { created_at: 'desc' },
        },
      },
    });
    res.json({ success: true, data: expenses });
  } catch (err) {
    console.error('Get my expenses error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch expenses' });
  }
};

export const getPendingExpenses = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Manager sees expenses where they have a pending approval request
    const pendingRequests = await prisma.approvalRequest.findMany({
      where: {
        approver_id: req.user!.id,
        status: 'PENDING',
      },
      include: {
        expense: {
          include: {
            employee: { select: { id: true, email: true, role: true } },
          },
        },
      },
      orderBy: { created_at: 'asc' },
    });

    const expenses = pendingRequests.map((r) => ({
      ...r.expense,
      approval_request_id: r.id,
    }));

    res.json({ success: true, data: expenses });
  } catch (err) {
    console.error('Get pending expenses error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch pending expenses' });
  }
};

export const getAllExpenses = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, employee_id, category, start_date, end_date, min_amount, max_amount } = req.query;

    const where: Record<string, unknown> = {
      employee: { company_id: req.user!.company_id },
    };

    if (status) where.status = status;
    if (employee_id) where.employee_id = employee_id;
    if (category) where.category = category;

    if (start_date || end_date) {
      where.expense_date = {};
      if (start_date) (where.expense_date as Record<string, unknown>).gte = new Date(start_date as string);
      if (end_date) (where.expense_date as Record<string, unknown>).lte = new Date(end_date as string);
    }

    if (min_amount || max_amount) {
      where.amount = {};
      if (min_amount) (where.amount as Record<string, unknown>).gte = parseFloat(min_amount as string);
      if (max_amount) (where.amount as Record<string, unknown>).lte = parseFloat(max_amount as string);
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        employee: { select: { id: true, email: true, role: true } },
        approval_requests: {
          include: { approver: { select: { id: true, email: true } } },
          orderBy: { created_at: 'desc' },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    res.json({ success: true, data: expenses });
  } catch (err) {
    console.error('Get all expenses error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch expenses' });
  }
};

export const approveExpense = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) {
      res.status(404).json({ success: false, error: 'Expense not found' });
      return;
    }

    await processApproval(id, req.user!.id, true, comment);

    await createAuditLog(
      id,
      req.user!.id,
      'APPROVED',
      { comment: comment || '' },
      req.ip
    );

    const updated = await prisma.expense.findUnique({ where: { id } });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Approve expense error:', err);
    res.status(500).json({ success: false, error: 'Failed to approve expense' });
  }
};

export const rejectExpense = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    if (!comment || comment.trim().length < 5) {
      res.status(400).json({ success: false, error: 'Rejection comment must be at least 5 characters' });
      return;
    }

    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) {
      res.status(404).json({ success: false, error: 'Expense not found' });
      return;
    }

    await processApproval(id, req.user!.id, false, comment);

    await createAuditLog(
      id,
      req.user!.id,
      'REJECTED',
      { comment },
      req.ip
    );

    const updated = await prisma.expense.findUnique({ where: { id } });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Reject expense error:', err);
    res.status(500).json({ success: false, error: 'Failed to reject expense' });
  }
};

export const ocrReceipt = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { image_base64, mime_type } = req.body;

    if (!image_base64 || !mime_type) {
      res.status(400).json({ success: false, error: 'image_base64 and mime_type are required' });
      return;
    }

    const result = await extractReceiptData(image_base64, mime_type);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('OCR error:', err);
    res.status(500).json({ success: false, error: 'OCR processing failed' });
  }
};

export const getExpenseAudit = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) {
      res.status(404).json({ success: false, error: 'Expense not found' });
      return;
    }

    // Admin can only see expenses in their company
    const employee = await prisma.user.findUnique({ where: { id: expense.employee_id } });
    if (!employee || employee.company_id !== req.user!.company_id) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    const audit = await prisma.auditLog.findMany({
      where: { expense_id: id },
      include: {
        actor: { select: { id: true, email: true, role: true } },
      },
      orderBy: { created_at: 'asc' },
    });

    res.json({ success: true, data: audit });
  } catch (err) {
    console.error('Get audit error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch audit logs' });
  }
};
