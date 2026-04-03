import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftElement,
      rightElement,
      size = 'md',
      fullWidth = false,
      className,
      id,
      disabled,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hasError = Boolean(error);

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-slate-700"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftElement && (
            <span className="pointer-events-none absolute left-3 flex items-center text-slate-400">
              {leftElement}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={cn(
              'w-full rounded-md border bg-white text-slate-900 placeholder-slate-400',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
              size === 'sm' ? 'h-8 text-sm' : 'h-10 text-sm',
              leftElement ? 'pl-9' : 'pl-3',
              rightElement ? 'pr-9' : 'pr-3',
              hasError
                ? 'border-red-400 focus:border-red-400 focus:ring-red-200'
                : 'border-border focus:border-navy-500 focus:ring-navy-100',
              className,
            )}
            {...props}
          />

          {rightElement && (
            <span className="absolute right-3 flex items-center text-slate-400">
              {rightElement}
            </span>
          )}
        </div>

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

Input.displayName = 'Input';
