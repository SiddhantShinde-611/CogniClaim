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
          <label htmlFor={textareaId} className="text-sm font-medium text-text-primary flex items-center gap-1">
            {label}
            {lowConfidence && (
              <span className="text-xs text-accent font-normal bg-yellow-50 px-1.5 py-0.5 rounded border border-yellow-200">
                Low confidence
              </span>
            )}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={cn(
            'flex min-h-[80px] w-full rounded-lg border bg-white px-3 py-2 text-sm text-text-primary placeholder:text-gray-400',
            'transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50 resize-y',
            error ? 'border-danger focus:ring-danger' : 'border-gray-200',
            lowConfidence && !error ? 'border-accent bg-yellow-50' : '',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
