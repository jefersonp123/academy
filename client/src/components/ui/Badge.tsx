import { cn } from '@/lib/utils';

export interface BadgeProps {
  color?: 'green' | 'red' | 'amber' | 'blue' | 'purple' | 'orange' | 'slate' | 'navy';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}

const colorClasses: Record<NonNullable<BadgeProps['color']>, string> = {
  green: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  red: 'bg-red-50 text-red-600 border border-red-200',
  amber: 'bg-amber-50 text-amber-700 border border-amber-200',
  blue: 'bg-blue-50 text-blue-700 border border-blue-200',
  purple: 'bg-purple-50 text-purple-700 border border-purple-200',
  orange: 'bg-orange-50 text-orange-700 border border-orange-200',
  slate: 'bg-slate-100 text-slate-600 border border-slate-200',
  navy: 'bg-navy-50 text-navy-700 border border-navy-200',
};

const dotColorClasses: Record<NonNullable<BadgeProps['color']>, string> = {
  green: 'bg-emerald-500',
  red: 'bg-red-500',
  amber: 'bg-amber-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
  slate: 'bg-slate-400',
  navy: 'bg-navy-500',
};

const sizeClasses: Record<NonNullable<BadgeProps['size']>, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
};

export function Badge({
  color = 'slate',
  size = 'md',
  dot = false,
  className,
  children,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        colorClasses[color],
        sizeClasses[size],
        className,
      )}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotColorClasses[color])}
        />
      )}
      {children}
    </span>
  );
}
