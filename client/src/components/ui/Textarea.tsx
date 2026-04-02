import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  rows?: number;
  resize?: 'none' | 'vertical';
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      hint,
      rows = 4,
      resize = 'vertical',
      fullWidth = false,
      className,
      id,
      disabled,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const hasError = Boolean(error);

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-slate-700"
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          disabled={disabled}
          className={cn(
            'w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
            resize === 'none' ? 'resize-none' : 'resize-y',
            hasError
              ? 'border-red-400 focus:border-red-400 focus:ring-red-200'
              : 'border-border focus:border-navy-500 focus:ring-navy-100',
            className,
          )}
          {...props}
        />

        {hasError && (
          <p className="text-xs text-red-500">{error}</p>
        )}
        {!hasError && hint && (
          <p className="text-xs text-slate-400">{hint}</p>
        )}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
