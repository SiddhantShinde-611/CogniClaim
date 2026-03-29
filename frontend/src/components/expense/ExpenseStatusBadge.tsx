import { Badge } from '../ui/Badge';
import { ExpenseStatus } from '../../types';
import { Clock, CheckCircle, XCircle, Eye } from 'lucide-react';

interface Props {
  status: ExpenseStatus;
}

export function ExpenseStatusBadge({ status }: Props) {
  const config = {
    PENDING: { variant: 'warning' as const, icon: Clock, label: 'Pending' },
    APPROVED: { variant: 'success' as const, icon: CheckCircle, label: 'Approved' },
    REJECTED: { variant: 'danger' as const, icon: XCircle, label: 'Rejected' },
    UNDER_REVIEW: { variant: 'review' as const, icon: Eye, label: 'Under Review' },
  }[status];

  return (
    <Badge variant={config.variant} className="gap-1">
      <config.icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
