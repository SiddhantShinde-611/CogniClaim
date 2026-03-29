import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ExpenseTable } from '../../components/expense/ExpenseTable';
import { Skeleton } from '../../components/ui/Skeleton';
import { useMyExpenses } from '../../hooks/useExpenses';
import { useAuthStore } from '../../stores/authStore';
import { formatCurrency, getMonthRange } from '../../lib/utils';
import { PlusCircle, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Expense } from '../../types';

export function EmployeeDashboard() {
  const { user } = useAuthStore();
  const { data: expenses = [], isLoading } = useMyExpenses();

  const { start, end } = getMonthRange();

  const stats = useMemo(() => {
    const thisMonth = expenses.filter((e: Expense) => {
      const d = new Date(e.created_at);
      return d >= start && d <= end;
    });

    return {
      total: thisMonth.length,
      totalAmount: thisMonth.reduce((sum, e) => sum + (e.converted_amount ?? e.amount), 0),
      pending: thisMonth.filter((e) => e.status === 'PENDING' || e.status === 'UNDER_REVIEW').length,
      approved: thisMonth.filter((e) => e.status === 'APPROVED').length,
      rejected: thisMonth.filter((e) => e.status === 'REJECTED').length,
    };
  }, [expenses, start, end]);

  const recentExpenses = expenses.slice(0, 5);
  const baseCurrency = user?.currency_code || 'USD';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-gray-500 text-sm">Overview for {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}</p>
        </div>
        <Link to="/employee/submit">
          <Button size="lg">
            <PlusCircle className="h-5 w-5" />
            Submit Expense
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-gradient-to-br from-primary to-primary-600 text-white border-0">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-primary-100 text-sm">Total This Month</p>
                  <TrendingUp className="h-5 w-5 text-primary-200" />
                </div>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalAmount, baseCurrency)}</p>
                <p className="text-primary-200 text-xs mt-1">{stats.total} expenses</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-500 text-sm">Pending Review</p>
                  <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-accent" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-text-primary">{stats.pending}</p>
                <p className="text-gray-400 text-xs mt-1">awaiting approval</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-500 text-sm">Approved</p>
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-success" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-text-primary">{stats.approved}</p>
                <p className="text-gray-400 text-xs mt-1">this month</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-500 text-sm">Rejected</p>
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                    <XCircle className="h-4 w-4 text-danger" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-text-primary">{stats.rejected}</p>
                <p className="text-gray-400 text-xs mt-1">this month</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Recent Expenses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Expenses</CardTitle>
            <Link to="/employee/expenses">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          <ExpenseTable expenses={recentExpenses} loading={isLoading} />
        </CardContent>
      </Card>

      {/* FAB */}
      <Link
        to="/employee/submit"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/40 flex items-center justify-center hover:bg-primary-600 transition-colors lg:hidden"
      >
        <PlusCircle className="h-7 w-7" />
      </Link>
    </div>
  );
}
