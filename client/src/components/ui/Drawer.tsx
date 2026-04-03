import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  side?: 'bottom' | 'right';
  children: React.ReactNode;
}

export function Drawer({
  open,
  onClose,
  title,
  side = 'bottom',
  children,
}: DrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            'fixed inset-0 bg-black/50 backdrop-blur-sm z-50',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
          )}
        />
        {side === 'bottom' ? (
          <Dialog.Content
            className={cn(
              'fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50',
              'max-h-[90vh] overflow-y-auto focus:outline-none',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom',
            )}
          >
            <div className="w-10 h-1 bg-slate-200 mx-auto rounded-full mt-3 mb-1" />
            {title && (
              <div className="relative flex items-center justify-between px-6 py-4">
                <Dialog.Title className="text-base font-semibold text-slate-900">
                  {title}
                </Dialog.Title>
                <Dialog.Close
                  className={cn(
                    'rounded-md p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100',
                    'transition-colors focus:outline-none focus:ring-2 focus:ring-navy-500',
                  )}
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4" />
                </Dialog.Close>
              </div>
            )}
            {children}
          </Dialog.Content>
        ) : (
          <Dialog.Content
            className={cn(
              'fixed top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50',
              'overflow-y-auto focus:outline-none',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right',
            )}
          >
            {title && (
              <div className="relative flex items-center justify-between px-6 py-4 border-b border-border">
                <Dialog.Title className="text-base font-semibold text-slate-900">
                  {title}
                </Dialog.Title>
                <Dialog.Close
                  className={cn(
                    'rounded-md p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100',
                    'transition-colors focus:outline-none focus:ring-2 focus:ring-navy-500',
                  )}
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4" />
                </Dialog.Close>
              </div>
            )}
            {children}
          </Dialog.Content>
        )}
      </Dialog.Portal>
    </Dialog.Root>
  );
}
