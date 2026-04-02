import { cn, getInitials } from '@/lib/utils';

export interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const sizeClass = sizeClasses[size];

  if (src) {
    return (
      <img
        src={src}
        alt={name ?? 'Avatar'}
        className={cn('object-cover rounded-full flex-shrink-0', sizeClass, className)}
      />
    );
  }

  const initials = name ? getInitials(name) : '?';

  return (
    <div
      className={cn(
        'bg-navy-100 text-navy-700 font-semibold rounded-full flex items-center justify-center flex-shrink-0',
        sizeClass,
        className,
      )}
      aria-label={name}
    >
      {initials}
    </div>
  );
}
