import { STATUS_LABELS, STATUS_COLORS } from '@/lib/constants';
import { Badge, type BadgeProps } from './Badge';

export interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  dot?: boolean;
}

export function StatusBadge({ status, size, dot }: StatusBadgeProps) {
  const label = STATUS_LABELS[status] ?? status;
  const color = (STATUS_COLORS[status] ?? 'slate') as BadgeProps['color'];

  return (
    <Badge color={color} size={size} dot={dot}>
      {label}
    </Badge>
  );
}
