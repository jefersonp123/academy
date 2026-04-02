import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'navy' | 'white' | 'slate';
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

const colorClasses = {
  navy: 'border-navy-200 border-t-navy-700',
  white: 'border-white/30 border-t-white',
  slate: 'border-slate-200 border-t-slate-600',
};

export function Spinner({ size = 'md', color = 'navy', className }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block animate-spin rounded-full border-2',
        sizeClasses[size],
        colorClasses[color],
        className,
      )}
    />
  );
}
