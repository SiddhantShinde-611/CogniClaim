import { Expense } from '../../types';
import { ApprovalCard } from './ApprovalCard';
import { Skeleton } from '../ui/Skeleton';

interface Props {
  expenses: Expense[];
  loading?: boolean;
}

export function ApprovalQueue({ expenses, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-4">
          <span className="text-4xl">✅</span>
        </div>
        <p className="text-gray-600 font-medium text-lg">All caught up!</p>
        <p className="text-gray-400 text-sm mt-1">No pending approvals at this time</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense) => (
        <ApprovalCard key={expense.id} expense={expense} />
      ))}
    </div>
  );
}
