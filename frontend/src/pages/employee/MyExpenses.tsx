import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ExpenseTable } from '../../components/expense/ExpenseTable';
import { Dialog } from '../../components/ui/Dialog';
import { AuditTimeline } from '../../components/audit/AuditTimeline';
import { ExpenseStatusBadge } from '../../components/expense/ExpenseStatusBadge';
import { useMyExpenses, useExpenseAudit } from '../../hooks/useExpenses';
import { Expense } from '../../types';
import { PlusCircle, FileText } from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';
import { useAuthStore } from '../../stores/authStore';

export function MyExpensesPage() {
  const { data: expenses = [], isLoading } = useMyExpenses();
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const { user } = useAuthStore();

  const { data: auditLogs = [], isLoading: loadingAudit } = useExpenseAudit(
    user?.role === 'ADMIN' ? selectedExpense?.id || '' : ''
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">My Expenses</h1>
          <p className="text-gray-500 text-sm">{expenses.length} total expenses</p>
        </div>
        <Link to="/employee/submit">
          <Button>
            <PlusCircle className="h-4 w-4" />
            New Expense
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            All Expenses
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          <ExpenseTable
            expenses={expenses}
            loading={isLoading}
            onRowClick={setSelectedExpense}
          />
        </CardContent>
      </Card>

      {/* Expense Detail Dialog */}
      <Dialog
        open={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        title="Expense Details"
        size="lg"
      >
        {selectedExpense && (
          <div className="space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-text-primary">
                  {selectedExpense.merchant_name || selectedExpense.description}
                </h3>
                <p className="text-sm text-gray-500">{formatDate(selectedExpense.expense_date)}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-text-primary">
                  {formatCurrency(selectedExpense.amount, selectedExpense.currency)}
                </p>
                <ExpenseStatusBadge status={selectedExpense.status} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm bg-surface rounded-xl p-4">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide">Category</p>
                <p className="font-medium mt-1">{selectedExpense.category}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide">Currency</p>
                <p className="font-medium mt-1">{selectedExpense.currency}</p>
              </div>
              {selectedExpense.converted_amount && (
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Converted</p>
                  <p className="font-medium mt-1">
                    {formatCurrency(selectedExpense.converted_amount, selectedExpense.base_currency || 'USD')}
                  </p>
                </div>
              )}
            </div>

            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Description</p>
              <p className="text-sm text-text-primary bg-surface rounded-lg p-3">
                {selectedExpense.description}
              </p>
            </div>

            {/* Approval history from approval_requests */}
            {selectedExpense.approval_requests && selectedExpense.approval_requests.length > 0 && (
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-3">Approval History</p>
                <div className="space-y-2">
                  {selectedExpense.approval_requests.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between text-sm bg-surface rounded-lg p-3"
                    >
                      <div>
                        <p className="font-medium">{req.approver?.email}</p>
                        {req.comment && (
                          <p className="text-gray-500 text-xs mt-0.5">"{req.comment}"</p>
                        )}
                      </div>
                      <ExpenseStatusBadge status={req.status as any} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audit trail (admin only) */}
            {user?.role === 'ADMIN' && (
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-3">Audit Trail</p>
                <AuditTimeline logs={auditLogs} loading={loadingAudit} />
              </div>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
}
