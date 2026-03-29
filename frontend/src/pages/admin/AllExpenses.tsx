import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Dialog } from '../../components/ui/Dialog';
import { ExpenseTable } from '../../components/expense/ExpenseTable';
import { AuditTimeline } from '../../components/audit/AuditTimeline';
import { ExpenseStatusBadge } from '../../components/expense/ExpenseStatusBadge';
import { useAllExpenses, useExpenseAudit } from '../../hooks/useExpenses';
import { Expense, EXPENSE_CATEGORIES } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Filter, History } from 'lucide-react';

interface Filters {
  status: string;
  category: string;
  start_date: string;
  end_date: string;
}

export function AllExpensesPage() {
  const [filters, setFilters] = useState<Filters>({
    status: '',
    category: '',
    start_date: '',
    end_date: '',
  });
  const [activeFilters, setActiveFilters] = useState<Filters>(filters);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const queryParams = Object.fromEntries(
    Object.entries(activeFilters).filter(([_, v]) => v !== '')
  );

  const { data: expenses = [], isLoading } = useAllExpenses(queryParams);
  const { data: auditLogs = [], isLoading: loadingAudit } = useExpenseAudit(selectedExpense?.id || '');

  const applyFilters = () => setActiveFilters(filters);
  const clearFilters = () => {
    const empty = { status: '', category: '', start_date: '', end_date: '' };
    setFilters(empty);
    setActiveFilters(empty);
  };

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'UNDER_REVIEW', label: 'Under Review' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
  ];

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c })),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">All Expenses</h1>
        <p className="text-gray-500 text-sm">{expenses.length} expenses found</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4 text-primary" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Select
              label="Status"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              options={statusOptions}
            />
            <Select
              label="Category"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              options={categoryOptions}
            />
            <Input
              label="From Date"
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
            />
            <Input
              label="To Date"
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
            />
          </div>
          <div className="flex gap-2 mt-4">
            <Button size="sm" onClick={applyFilters}>Apply Filters</Button>
            <Button variant="outline" size="sm" onClick={clearFilters}>Clear</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 pb-2">
          <ExpenseTable
            expenses={expenses}
            loading={isLoading}
            showEmployee
            onRowClick={setSelectedExpense}
          />
        </CardContent>
      </Card>

      {/* Expense Detail + Audit Dialog */}
      <Dialog
        open={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        title="Expense Details & Audit Trail"
        size="xl"
      >
        {selectedExpense && (
          <div className="space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-text-primary text-lg">
                  {selectedExpense.merchant_name || selectedExpense.description}
                </h3>
                <p className="text-sm text-gray-500">
                  Submitted by {selectedExpense.employee?.email} · {formatDate(selectedExpense.expense_date)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-text-primary">
                  {formatCurrency(selectedExpense.amount, selectedExpense.currency)}
                </p>
                <ExpenseStatusBadge status={selectedExpense.status} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 bg-surface rounded-xl p-4 text-sm">
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
              <p className="text-sm text-text-primary bg-surface rounded-lg p-3">{selectedExpense.description}</p>
            </div>

            {/* Audit Trail */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <History className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-text-primary">Full Audit Trail</p>
              </div>
              <AuditTimeline logs={auditLogs} loading={loadingAudit} />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
