import * as RadixTabs from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

export const Tabs = RadixTabs.Root;

export function TabsList({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixTabs.List>) {
  return (
    <RadixTabs.List
      className={cn(
        'bg-slate-100 p-1 rounded-lg inline-flex items-center gap-1',
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixTabs.Trigger>) {
  return (
    <RadixTabs.Trigger
      className={cn(
        'rounded-md px-4 py-1.5 text-sm font-medium text-slate-600 transition-all',
        'data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-navy-700',
        'hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-500',
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixTabs.Content>) {
  return (
    <RadixTabs.Content
      className={cn('focus:outline-none mt-4', className)}
      {...props}
    />
  );
}
