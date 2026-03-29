import { ExpenseStatus, ApprovalStatus, Role } from '@prisma/client';
import { prisma } from '../lib/prisma';

export async function initiateApprovalWorkflow(
  expenseId: string,
  employeeId: string,
  companyId: string
): Promise<void> {
  const employee = await prisma.user.findUnique({ where: { id: employeeId } });
  if (!employee) throw new Error('Employee not found');

  // ADMIN expenses are auto-approved — no one is above admin
  if (employee.role === Role.ADMIN) {
    await prisma.expense.update({
      where: { id: expenseId },
      data: { status: ExpenseStatus.APPROVED },
    });
    return;
  }

  const policy = await prisma.approvalPolicy.findFirst({
    where: { company_id: companyId },
    include: { steps: { orderBy: { step_order: 'asc' } } },
  });

  if (!policy || policy.steps.length === 0) {
    // No policy: auto-approve
    await prisma.expense.update({
      where: { id: expenseId },
      data: { status: ExpenseStatus.APPROVED },
    });
    return;
  }

  // MANAGER expenses skip MANAGER-level steps — only ADMIN steps apply
  const stepsToUse = employee.role === Role.MANAGER
    ? policy.steps.filter((s) => s.approver_role === Role.ADMIN || s.approver_user_id !== null)
    : policy.steps;

  if (stepsToUse.length === 0) {
    await prisma.expense.update({
      where: { id: expenseId },
      data: { status: ExpenseStatus.APPROVED },
    });
    return;
  }

  // Mark expense as UNDER_REVIEW
  await prisma.expense.update({
    where: { id: expenseId },
    data: { status: ExpenseStatus.UNDER_REVIEW },
  });

  // If employee's manager is set as approver, create request for manager first
  if (employee.is_manager_approver && employee.manager_id) {
    const firstStep = stepsToUse[0];
    await prisma.approvalRequest.create({
      data: {
        expense_id: expenseId,
        step_id: firstStep.id,
        approver_id: employee.manager_id,
        status: ApprovalStatus.PENDING,
      },
    });
    return;
  }

  await createApprovalRequestForStep(expenseId, stepsToUse[0], companyId);
}

async function createApprovalRequestForStep(
  expenseId: string,
  step: { id: string; approver_role: Role | null; approver_user_id: string | null },
  companyId: string
): Promise<void> {
  let approverId: string | null = null;

  if (step.approver_user_id) {
    approverId = step.approver_user_id;
  } else if (step.approver_role) {
    const approver = await prisma.user.findFirst({
      where: { company_id: companyId, role: step.approver_role },
    });
    approverId = approver?.id ?? null;
  }

  if (!approverId) {
    // No approver found, skip step
    return;
  }

  await prisma.approvalRequest.create({
    data: {
      expense_id: expenseId,
      step_id: step.id,
      approver_id: approverId,
      status: ApprovalStatus.PENDING,
    },
  });
}

export async function processApproval(
  expenseId: string,
  approverId: string,
  approved: boolean,
  comment?: string
): Promise<void> {
  const expense = await prisma.expense.findUnique({ where: { id: expenseId } });
  if (!expense) throw new Error('Expense not found');

  const pendingRequest = await prisma.approvalRequest.findFirst({
    where: {
      expense_id: expenseId,
      approver_id: approverId,
      status: ApprovalStatus.PENDING,
    },
    include: { step: { include: { policy: { include: { steps: { orderBy: { step_order: 'asc' } } } } } } },
  });

  if (!pendingRequest) throw new Error('No pending approval request found');

  // Update current request
  await prisma.approvalRequest.update({
    where: { id: pendingRequest.id },
    data: {
      status: approved ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED,
      comment: comment || null,
      decided_at: new Date(),
    },
  });

  if (!approved) {
    // Reject expense immediately
    await prisma.expense.update({
      where: { id: expenseId },
      data: { status: ExpenseStatus.REJECTED },
    });
    return;
  }

  const policy = pendingRequest.step.policy;
  const currentStepOrder = pendingRequest.step.step_order;
  const allSteps = policy.steps;
  const nextStep = allSteps.find((s) => s.step_order === currentStepOrder + 1);

  if (!nextStep) {
    // All steps approved
    await handleFinalApproval(expenseId, policy);
    return;
  }

  // Check policy-level conditions for PERCENTAGE, SPECIFIC, HYBRID
  if (policy.rule_type === 'PERCENTAGE' && policy.percentage_threshold !== null) {
    const allRequests = await prisma.approvalRequest.findMany({
      where: { expense_id: expenseId, status: ApprovalStatus.APPROVED },
    });
    const approvedCount = allRequests.length;
    const totalSteps = allSteps.length;
    const percentageApproved = (approvedCount / totalSteps) * 100;

    if (percentageApproved >= policy.percentage_threshold) {
      await prisma.expense.update({
        where: { id: expenseId },
        data: { status: ExpenseStatus.APPROVED },
      });
      return;
    }
  }

  if (policy.rule_type === 'SPECIFIC' && policy.specific_approver_id) {
    const specificApproved = await prisma.approvalRequest.findFirst({
      where: {
        expense_id: expenseId,
        approver_id: policy.specific_approver_id,
        status: ApprovalStatus.APPROVED,
      },
    });
    if (specificApproved) {
      await prisma.expense.update({
        where: { id: expenseId },
        data: { status: ExpenseStatus.APPROVED },
      });
      return;
    }
  }

  if (policy.rule_type === 'HYBRID' && policy.percentage_threshold !== null && policy.specific_approver_id) {
    const allRequests = await prisma.approvalRequest.findMany({
      where: { expense_id: expenseId, status: ApprovalStatus.APPROVED },
    });
    const approvedCount = allRequests.length;
    const totalSteps = allSteps.length;
    const percentageApproved = (approvedCount / totalSteps) * 100;
    const meetsPercentage = percentageApproved >= policy.percentage_threshold;

    const specificApproved = allRequests.some((r) => r.approver_id === policy.specific_approver_id);

    if (meetsPercentage || specificApproved) {
      await prisma.expense.update({
        where: { id: expenseId },
        data: { status: ExpenseStatus.APPROVED },
      });
      return;
    }
  }

  // Move to next step
  const employee = await prisma.user.findUnique({ where: { id: expense.employee_id } });
  await createApprovalRequestForStep(expenseId, nextStep, employee?.company_id || '');
}

async function handleFinalApproval(expenseId: string, policy: { rule_type: string }): Promise<void> {
  await prisma.expense.update({
    where: { id: expenseId },
    data: { status: ExpenseStatus.APPROVED },
  });
}
