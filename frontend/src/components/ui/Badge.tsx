import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary-100 text-primary-700',
        success: 'border-green-200 bg-green-50 text-success',
        danger: 'border-red-200 bg-red-50 text-danger',
        warning: 'border-yellow-200 bg-yellow-50 text-accent',
        review: 'border-purple-200 bg-purple-50 text-primary',
        outline: 'border-gray-200 bg-white text-gray-600',
        gray: 'border-gray-200 bg-gray-100 text-gray-600',
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
