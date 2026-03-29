import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ExpenseTable } from '../../components/expense/ExpenseTable';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAllExpenses } from '../../hooks/useExpenses';
import { useAuthStore } from '../../stores/authStore';
import { formatCurrency, getMonthRange } from '../../lib/utils';
import {
  BarChart3,
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  DollarSign,
  FileText,
} from 'lucide-react';
import { Expense } from '../../types';

export function AdminDashboard() {
  const { user } = useAuthStore();
  const { data: expenses = [], isLoading } = useAllExpenses();

  const { start, end } = getMonthRange();
  const baseCurrency = user?.currency_code || 'USD';

  const stats = useMemo(() => {
    const thisMonth = expenses.filter((e: Expense) => {
      const d = new Date(e.created_at);
      return d >= start && d <= end;
    });

    const approved = thisMonth.filter((e) => e.status === 'APPROVED');
    const rejected = thisMonth.filter((e) => e.status === 'REJECTED');
    const pending = thisMonth.filter((e) => e.status === 'PENDING' || e.status === 'UNDER_REVIEW');
    const totalAmount = approved.reduce((sum, e) => sum + (e.converted_amount ?? e.amount), 0);

    return {
      total: thisMonth.length,
      approved: approved.length,
      rejected: rejected.length,
      pending: pending.length,
      totalApprovedAmount: totalAmount,
      approvalRate: thisMonth.length ? Math.round((approved.length / thisMonth.length) * 100) : 0,
    };
  }, [expenses, start, end]);

  const recentExpenses = expenses.slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm">
            {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })} overview
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/users">
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4" />
              Manage Users
            </Button>
          </Link>
          <Link to="/admin/expenses">
            <Button size="sm">
              <FileText className="h-4 w-4" />
              All Expenses
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-gradient-to-br from-primary to-primary-600 text-white border-0">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-primary-100 text-sm">Total Approved</p>
                  <DollarSign className="h-5 w-5 text-primary-200" />
                </div>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalApprovedAmount, baseCurrency)}</p>
                <p className="text-primary-200 text-xs mt-1">{stats.approved} expenses</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-500 text-sm">All Expenses</p>
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
                <p className="text-gray-400 text-xs mt-1">{stats.approvalRate}% approval rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-500 text-sm">Pending</p>
                  <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-accent" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-text-primary">{stats.pending}</p>
                <p className="text-gray-400 text-xs mt-1">need attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-500 text-sm">Approval Rate</p>
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    {stats.approvalRate >= 50 ? (
                      <TrendingUp className="h-4 w-4 text-success" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-danger" />
                    )}
                  </div>
                </div>
                <p className="text-2xl font-bold text-text-primary">{stats.approvalRate}%</p>
                <p className="text-gray-400 text-xs mt-1">{stats.rejected} rejected</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/admin/users">
          <Card className="hover:border-primary-200 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-text-primary">User Management</p>
                <p className="text-xs text-gray-400">Add employees, assign roles</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/rules">
          <Card className="hover:border-primary-200 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="font-semibold text-text-primary">Approval Rules</p>
                <p className="text-xs text-gray-400">Configure workflows</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/expenses">
          <Card className="hover:border-primary-200 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <FileText className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="font-semibold text-text-primary">All Expenses</p>
                <p className="text-xs text-gray-400">Browse, filter, audit</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Expenses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Expenses</CardTitle>
            <Link to="/admin/expenses">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          <ExpenseTable expenses={recentExpenses} loading={isLoading} showEmployee />
        </CardContent>
      </Card>
    </div>
  );
}
