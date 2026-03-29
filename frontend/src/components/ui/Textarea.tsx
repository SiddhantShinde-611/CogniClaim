import * as React from 'react';
import { cn } from '../../lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  lowConfidence?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, lowConfidence, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium text-text-primary flex items-center gap-1.5">
            {label}
            {lowConfidence && (
              <span className="text-xs text-accent-700 font-normal bg-accent-50 px-1.5 py-0.5 rounded-sm border border-accent-200">
                Low confidence
              </span>
            )}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={cn(
            'flex min-h-[80px] w-full rounded-sm border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-muted',
            'transition-colors focus:outline-none focus:border-primary-600',
            'disabled:cursor-not-allowed disabled:opacity-50 resize-y',
            error ? 'border-danger' : 'border-border-strong',
            lowConfidence && !error ? 'border-accent-400 bg-accent-50' : '',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
