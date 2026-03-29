import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary-100 text-primary-600',
        success: 'bg-success-surface border border-green-200 text-success',
        danger: 'bg-danger-surface border border-red-200 text-danger',
        warning: 'bg-warning-surface border border-amber-200 text-warning',
        review: 'bg-primary-100 border border-primary-200 text-primary-600',
        outline: 'border-border bg-panel text-text-secondary',
        gray: 'border-border bg-panel text-text-secondary',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
