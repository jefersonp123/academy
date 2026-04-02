import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center py-16 px-6 text-center', className)}>
      {icon && (
        <div className="text-slate-300 mb-4 text-4xl [&>svg]:w-12 [&>svg]:h-12 [&>svg]:mx-auto">
          {icon}
        </div>
      )}
      <p className="text-base font-semibold text-slate-700 mb-1">{title}</p>
      {description && (
        <p className="text-sm text-slate-400 mb-6 max-w-xs mx-auto">{description}</p>
      )}
      {action && (
        <Button variant="primary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
