import { AuditLog } from '../../types';
import { formatDateTime } from '../../lib/utils';
import { CheckCircle, XCircle, Send, Eye, Edit, AlertCircle } from 'lucide-react';
import { Skeleton } from '../ui/Skeleton';

interface Props {
  logs: AuditLog[];
  loading?: boolean;
}

const actionConfig: Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
}> = {
  SUBMITTED: {
    icon: Send,
    color: 'text-primary',
    bgColor: 'bg-primary-50',
    borderColor: 'border-primary-200',
    label: 'Submitted',
  },
  APPROVED: {
    icon: CheckCircle,
    color: 'text-success',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: 'Approved',
  },
  REJECTED: {
    icon: XCircle,
    color: 'text-danger',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'Rejected',
  },
  UNDER_REVIEW: {
    icon: Eye,
    color: 'text-accent',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    label: 'Moved to Review',
  },
  EDITED: {
    icon: Edit,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    label: 'Edited',
  },
};

export function AuditTimeline({ logs, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
            <Skeleton className="flex-1 h-16 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <AlertCircle className="h-8 w-8 text-gray-300 mb-2" />
        <p className="text-gray-400 text-sm">No audit logs found</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-0">
      {/* Vertical line */}
      <div className="absolute left-4 top-5 bottom-5 w-0.5 bg-gray-100" />

      {logs.map((log, index) => {
        const config = actionConfig[log.action] || {
          icon: AlertCircle,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          label: log.action,
        };

        const metadata = log.metadata as Record<string, string | number | null | undefined>;

        return (
          <div key={log.id} className={`flex gap-4 ${index < logs.length - 1 ? 'pb-6' : ''}`}>
            {/* Icon */}
            <div
              className={`relative z-10 flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center border-2 ${config.bgColor} ${config.borderColor}`}
            >
              <config.icon className={`h-4 w-4 ${config.color}`} />
            </div>

            {/* Content */}
            <div className={`flex-1 rounded-xl border p-4 ${config.bgColor} ${config.borderColor}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className={`text-sm font-semibold ${config.color}`}>{config.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    by{' '}
                    <span className="font-medium text-text-primary">{log.actor.email}</span>
                    {' '}({log.actor.role})
                  </p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {formatDateTime(log.created_at)}
                </span>
              </div>

              {/* Metadata */}
              {Object.keys(metadata).length > 0 && (
                <div className="mt-2 pt-2 border-t border-white/50 space-y-1">
                  {metadata.comment && (
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">Comment:</span> {metadata.comment}
                    </p>
                  )}
                  {metadata.amount && (
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">Amount:</span> {String(metadata.amount)} {String(metadata.currency || '')}
                    </p>
                  )}
                  {metadata.category && (
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">Category:</span> {String(metadata.category)}
                    </p>
                  )}
                  {log.ip_address && (
                    <p className="text-xs text-gray-400">
                      IP: {log.ip_address}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
