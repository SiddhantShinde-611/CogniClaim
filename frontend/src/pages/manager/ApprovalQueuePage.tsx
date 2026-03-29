import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { ApprovalQueue } from '../../components/approval/ApprovalQueue';
import { usePendingExpenses } from '../../hooks/useExpenses';
import { CheckSquare, Clock } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

export function ApprovalQueuePage() {
  const { data: expenses = [], isLoading } = usePendingExpenses();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Approval Queue</h1>
          <p className="text-gray-500 text-sm">Review and process expense requests</p>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-accent" />
          <Badge variant="warning">{expenses.length} pending</Badge>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{expenses.length}</p>
              <p className="text-xs text-gray-500">Awaiting your review</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            Pending Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ApprovalQueue expenses={expenses} loading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
