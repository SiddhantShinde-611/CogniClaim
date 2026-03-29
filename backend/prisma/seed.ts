import { PrismaClient, Role, ExpenseStatus, ApprovalStatus, RuleType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── Company definitions (top Odoo markets) ─────────────────────────────────
const COMPANIES = [
  { name: 'Nexus Solutions Inc.',       country: 'United States', currency_code: 'USD' },
  { name: 'Odoo Consulting BVBA',       country: 'Belgium',       currency_code: 'EUR' },
  { name: 'TechBridge India Pvt. Ltd.', country: 'India',         currency_code: 'INR' },
  { name: 'Grupo Horizonte S.A. de C.V.',country: 'Mexico',       currency_code: 'MXN' },
  { name: 'Soluciones Ágiles S.L.',     country: 'Spain',         currency_code: 'EUR' },
  { name: 'Al-Rashid Ventures',         country: 'Saudi Arabia',  currency_code: 'SAR' },
  { name: 'Lumière Technologies SAS',   country: 'France',        currency_code: 'EUR' },
  { name: 'Brücke Digital GmbH',        country: 'Germany',       currency_code: 'EUR' },
  { name: 'Summit Advisory AG',         country: 'Switzerland',   currency_code: 'CHF' },
];

// ─── Expense categories & sample data ────────────────────────────────────────
const CATEGORIES = ['Travel', 'Meals', 'Accommodation', 'Office Supplies', 'Software', 'Equipment', 'Marketing', 'Training'];

interface SeedExpense {
  merchant: string;
  category: string;
  description: string;
  amountFactor: number; // multiply by currency base amount
}

const EXPENSE_TEMPLATES: SeedExpense[] = [
  { merchant: 'Delta Airlines',     category: 'Travel',          description: 'Flight to client site for Q1 review meeting', amountFactor: 4.5 },
  { merchant: 'Marriott Hotels',    category: 'Accommodation',   description: '3-night stay during partner conference',       amountFactor: 3.2 },
  { merchant: 'Uber Business',      category: 'Travel',          description: 'Airport transfers for team lead',              amountFactor: 0.8 },
  { merchant: 'Starbucks',          category: 'Meals',           description: 'Client breakfast meeting',                     amountFactor: 0.3 },
  { merchant: 'AWS',                category: 'Software',        description: 'Monthly cloud infrastructure bill',            amountFactor: 6.0 },
  { merchant: 'Microsoft 365',      category: 'Software',        description: 'Annual license renewal for 10 seats',          amountFactor: 2.5 },
  { merchant: 'FedEx',              category: 'Office Supplies', description: 'Shipment of demo equipment to trade show',     amountFactor: 0.6 },
  { merchant: 'Hilton Garden Inn',  category: 'Accommodation',   description: 'Accommodation for sales training workshop',    amountFactor: 2.8 },
  { merchant: 'LinkedIn Ads',       category: 'Marketing',       description: 'Sponsored campaign for product launch',        amountFactor: 5.0 },
  { merchant: 'Udemy Business',     category: 'Training',        description: 'Team subscription for online courses Q2',      amountFactor: 1.5 },
  { merchant: 'HP Store',           category: 'Equipment',       description: 'Replacement laptop for onboarded engineer',    amountFactor: 12.0 },
  { merchant: 'Grab Food',          category: 'Meals',           description: 'Team lunch during sprint review',              amountFactor: 0.4 },
  { merchant: 'Zoom Pro',           category: 'Software',        description: 'Quarterly video conferencing subscription',    amountFactor: 0.9 },
  { merchant: 'Staples',            category: 'Office Supplies', description: 'Stationery and printer cartridges',            amountFactor: 0.5 },
  { merchant: 'Google Ads',         category: 'Marketing',       description: 'Paid search campaign for new market entry',    amountFactor: 7.0 },
];

// Base amounts per currency (realistic local values)
const BASE_AMOUNTS: Record<string, number> = {
  USD: 100, EUR: 95, INR: 8000, MXN: 1700, SAR: 375, CHF: 92,
};

function getAmount(currency: string, factor: number): number {
  const base = BASE_AMOUNTS[currency] || 100;
  return Math.round(base * factor * (0.85 + Math.random() * 0.3) * 100) / 100;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  console.log('🌱 Starting CogniClaim seed...');

  // Clean existing data (except companies/users from manual signup)
  await prisma.auditLog.deleteMany();
  await prisma.approvalRequest.deleteMany();
  await prisma.approvalStep.deleteMany();
  await prisma.approvalPolicy.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();
  console.log('🗑️  Cleared existing data');

  const hash = await bcrypt.hash('Demo@1234', 12);

  for (const companyData of COMPANIES) {
    // ── Create Company ──────────────────────────────────────────────────────
    const company = await prisma.company.create({ data: companyData });
    console.log(`\n🏢 ${company.name} (${company.country} · ${company.currency_code})`);

    // ── Create Users ────────────────────────────────────────────────────────
    const slug = company.name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 10);

    const admin = await prisma.user.create({
      data: { email: `admin@${slug}.demo`, password_hash: hash, role: 'ADMIN', company_id: company.id },
    });

    const manager1 = await prisma.user.create({
      data: { email: `manager1@${slug}.demo`, password_hash: hash, role: 'MANAGER', company_id: company.id, is_manager_approver: true },
    });

    const manager2 = await prisma.user.create({
      data: { email: `manager2@${slug}.demo`, password_hash: hash, role: 'MANAGER', company_id: company.id, is_manager_approver: false },
    });

    const emp1 = await prisma.user.create({
      data: { email: `alice@${slug}.demo`, password_hash: hash, role: 'EMPLOYEE', company_id: company.id, manager_id: manager1.id },
    });

    const emp2 = await prisma.user.create({
      data: { email: `bob@${slug}.demo`, password_hash: hash, role: 'EMPLOYEE', company_id: company.id, manager_id: manager1.id },
    });

    const emp3 = await prisma.user.create({
      data: { email: `carol@${slug}.demo`, password_hash: hash, role: 'EMPLOYEE', company_id: company.id, manager_id: manager2.id },
    });

    console.log(`   👤 Admin: admin@${slug}.demo`);
    console.log(`   👤 Managers: manager1, manager2`);
    console.log(`   👤 Employees: alice, bob, carol`);

    // ── Create Approval Policy (Sequential + Conditional) ───────────────────
    const policy = await prisma.approvalPolicy.create({
      data: {
        company_id: company.id,
        name: 'Standard Approval Policy',
        rule_type: 'SEQUENTIAL' as RuleType,
      },
    });

    const step1 = await prisma.approvalStep.create({
      data: { policy_id: policy.id, step_order: 1, approver_role: 'MANAGER' as Role },
    });

    const step2 = await prisma.approvalStep.create({
      data: { policy_id: policy.id, step_order: 2, approver_user_id: admin.id },
    });

    // ── Create Expenses with various statuses ───────────────────────────────
    const employees = [emp1, emp2, emp3];
    const cur = company.currency_code;

    // 1. FULLY APPROVED expense (emp1)
    const approvedExp = await prisma.expense.create({
      data: {
        employee_id: emp1.id,
        amount: getAmount(cur, 2.5),
        currency: cur,
        converted_amount: getAmount(cur, 2.5),
        base_currency: cur,
        category: 'Travel',
        description: 'Flight to headquarters for annual strategy review',
        expense_date: daysAgo(20),
        status: 'APPROVED' as ExpenseStatus,
        merchant_name: 'Emirates Airlines',
        created_at: daysAgo(20),
      },
    });
    await prisma.approvalRequest.create({
      data: { expense_id: approvedExp.id, step_id: step1.id, approver_id: manager1.id, status: 'APPROVED' as ApprovalStatus, comment: 'Approved — travel is justified for this meeting.', decided_at: daysAgo(19) },
    });
    await prisma.approvalRequest.create({
      data: { expense_id: approvedExp.id, step_id: step2.id, approver_id: admin.id, status: 'APPROVED' as ApprovalStatus, comment: 'Final approval granted.', decided_at: daysAgo(18) },
    });
    await prisma.auditLog.create({ data: { expense_id: approvedExp.id, actor_id: emp1.id,    action: 'SUBMITTED', metadata: { amount: approvedExp.amount, currency: cur }, ip_address: '192.168.1.10', created_at: daysAgo(20) } });
    await prisma.auditLog.create({ data: { expense_id: approvedExp.id, actor_id: manager1.id, action: 'APPROVED',  metadata: { step: 1, comment: 'Approved — travel is justified.' }, ip_address: '192.168.1.21', created_at: daysAgo(19) } });
    await prisma.auditLog.create({ data: { expense_id: approvedExp.id, actor_id: admin.id,    action: 'APPROVED',  metadata: { step: 2, comment: 'Final approval granted.' }, ip_address: '192.168.1.1',  created_at: daysAgo(18) } });

    // 2. REJECTED expense (emp2)
    const rejectedExp = await prisma.expense.create({
      data: {
        employee_id: emp2.id,
        amount: getAmount(cur, 8.0),
        currency: cur,
        converted_amount: getAmount(cur, 8.0),
        base_currency: cur,
        category: 'Equipment',
        description: 'Requested high-end monitor — personal use suspected',
        expense_date: daysAgo(15),
        status: 'REJECTED' as ExpenseStatus,
        merchant_name: 'Apple Store',
        created_at: daysAgo(15),
      },
    });
    await prisma.approvalRequest.create({
      data: { expense_id: rejectedExp.id, step_id: step1.id, approver_id: manager1.id, status: 'REJECTED' as ApprovalStatus, comment: 'Cannot approve — exceeds equipment budget for this quarter. Please resubmit next quarter with manager pre-approval.', decided_at: daysAgo(14) },
    });
    await prisma.auditLog.create({ data: { expense_id: rejectedExp.id, actor_id: emp2.id,    action: 'SUBMITTED', metadata: { amount: rejectedExp.amount, currency: cur }, ip_address: '192.168.1.11', created_at: daysAgo(15) } });
    await prisma.auditLog.create({ data: { expense_id: rejectedExp.id, actor_id: manager1.id, action: 'REJECTED',  metadata: { step: 1, comment: 'Exceeds equipment budget.' }, ip_address: '192.168.1.21', created_at: daysAgo(14) } });

    // 3. PENDING (awaiting manager1) — emp3
    const pending1 = await prisma.expense.create({
      data: {
        employee_id: emp3.id,
        amount: getAmount(cur, 1.2),
        currency: cur,
        converted_amount: getAmount(cur, 1.2),
        base_currency: cur,
        category: 'Meals',
        description: 'Client dinner at premium restaurant during contract negotiation',
        expense_date: daysAgo(3),
        status: 'PENDING' as ExpenseStatus,
        merchant_name: 'The Capital Grille',
        created_at: daysAgo(3),
      },
    });
    await prisma.approvalRequest.create({
      data: { expense_id: pending1.id, step_id: step1.id, approver_id: manager2.id, status: 'PENDING' as ApprovalStatus },
    });
    await prisma.auditLog.create({ data: { expense_id: pending1.id, actor_id: emp3.id, action: 'SUBMITTED', metadata: { amount: pending1.amount, currency: cur }, ip_address: '192.168.1.12', created_at: daysAgo(3) } });

    // 4. UNDER_REVIEW (manager approved, pending admin) — emp1
    const underReview = await prisma.expense.create({
      data: {
        employee_id: emp1.id,
        amount: getAmount(cur, 5.5),
        currency: cur,
        converted_amount: getAmount(cur, 5.5),
        base_currency: cur,
        category: 'Marketing',
        description: 'Sponsored booth at industry expo — full payment upfront',
        expense_date: daysAgo(7),
        status: 'UNDER_REVIEW' as ExpenseStatus,
        merchant_name: 'TechExpo Events',
        created_at: daysAgo(7),
      },
    });
    await prisma.approvalRequest.create({
      data: { expense_id: underReview.id, step_id: step1.id, approver_id: manager1.id, status: 'APPROVED' as ApprovalStatus, comment: 'Marketing spend aligns with our Q2 plan.', decided_at: daysAgo(6) },
    });
    await prisma.approvalRequest.create({
      data: { expense_id: underReview.id, step_id: step2.id, approver_id: admin.id, status: 'PENDING' as ApprovalStatus },
    });
    await prisma.auditLog.create({ data: { expense_id: underReview.id, actor_id: emp1.id,    action: 'SUBMITTED', metadata: { amount: underReview.amount, currency: cur }, ip_address: '192.168.1.10', created_at: daysAgo(7) } });
    await prisma.auditLog.create({ data: { expense_id: underReview.id, actor_id: manager1.id, action: 'APPROVED',  metadata: { step: 1 }, ip_address: '192.168.1.21', created_at: daysAgo(6) } });

    // 5–9. More APPROVED expenses (varied employees, older dates)
    const moreExpenses = [
      { emp: emp1, t: EXPENSE_TEMPLATES[5],  dago: 45, factor: 1.8, status: 'APPROVED' as ExpenseStatus },
      { emp: emp2, t: EXPENSE_TEMPLATES[9],  dago: 38, factor: 1.2, status: 'APPROVED' as ExpenseStatus },
      { emp: emp3, t: EXPENSE_TEMPLATES[12], dago: 30, factor: 0.7, status: 'APPROVED' as ExpenseStatus },
      { emp: emp1, t: EXPENSE_TEMPLATES[2],  dago: 22, factor: 0.9, status: 'APPROVED' as ExpenseStatus },
      { emp: emp2, t: EXPENSE_TEMPLATES[6],  dago: 10, factor: 0.5, status: 'PENDING'  as ExpenseStatus },
    ];

    for (const e of moreExpenses) {
      const exp = await prisma.expense.create({
        data: {
          employee_id: e.emp.id,
          amount: getAmount(cur, e.factor),
          currency: cur,
          converted_amount: getAmount(cur, e.factor),
          base_currency: cur,
          category: e.t.category,
          description: e.t.description,
          expense_date: daysAgo(e.dago),
          status: e.status,
          merchant_name: e.t.merchant,
          created_at: daysAgo(e.dago),
        },
      });

      await prisma.auditLog.create({
        data: { expense_id: exp.id, actor_id: e.emp.id, action: 'SUBMITTED', metadata: { amount: exp.amount, currency: cur }, ip_address: '192.168.1.10', created_at: daysAgo(e.dago) },
      });

      if (e.status === 'APPROVED') {
        await prisma.approvalRequest.create({
          data: { expense_id: exp.id, step_id: step1.id, approver_id: manager1.id, status: 'APPROVED' as ApprovalStatus, comment: 'Approved.', decided_at: daysAgo(e.dago - 1) },
        });
        await prisma.approvalRequest.create({
          data: { expense_id: exp.id, step_id: step2.id, approver_id: admin.id, status: 'APPROVED' as ApprovalStatus, comment: 'Confirmed.', decided_at: daysAgo(e.dago - 2) },
        });
        await prisma.auditLog.create({ data: { expense_id: exp.id, actor_id: manager1.id, action: 'APPROVED', metadata: { step: 1 }, ip_address: '192.168.1.21', created_at: daysAgo(e.dago - 1) } });
        await prisma.auditLog.create({ data: { expense_id: exp.id, actor_id: admin.id, action: 'APPROVED', metadata: { step: 2 }, ip_address: '192.168.1.1', created_at: daysAgo(e.dago - 2) } });
      } else {
        await prisma.approvalRequest.create({
          data: { expense_id: exp.id, step_id: step1.id, approver_id: manager1.id, status: 'PENDING' as ApprovalStatus },
        });
      }
    }

    console.log(`   ✅ Created 9 expenses (APPROVED/REJECTED/PENDING/UNDER_REVIEW)`);
  }

  console.log('\n✅ Seed complete! Summary:');
  console.log(`   Companies : ${COMPANIES.length}`);
  console.log(`   Users/co  : 6 (1 admin + 2 managers + 3 employees)`);
  console.log(`   Expenses  : ~9 per company`);
  console.log('\n🔑 Login password for ALL demo accounts: Demo@1234');
  console.log('\n📧 Example logins (India company):');
  console.log('   admin@techbridgein.demo   → ADMIN');
  console.log('   manager1@techbridgein.demo → MANAGER');
  console.log('   alice@techbridgein.demo    → EMPLOYEE');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
