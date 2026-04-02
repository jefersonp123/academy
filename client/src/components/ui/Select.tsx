import { useId } from 'react';
import * as RadixSelect from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  label?: string;
  error?: string;
  placeholder?: string;
  options: SelectOption[];
  size?: 'sm' | 'md';
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function Select({
  label,
  error,
  placeholder = 'Seleccionar…',
  options,
  size = 'md',
  value,
  onValueChange,
  disabled,
  className,
  id,
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const hasError = Boolean(error);

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-sm font-medium text-slate-700"
        >
          {label}
        </label>
      )}

      <RadixSelect.Root
        value={value === '' ? '__all__' : value}
        onValueChange={(v) => onValueChange?.(v === '__all__' ? '' : v)}
        disabled={disabled}
      >
        <RadixSelect.Trigger
          id={selectId}
          className={cn(
            'flex w-full items-center justify-between rounded-md border bg-white px-3 text-sm',
            'text-slate-900 placeholder-slate-400 transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
            'data-[placeholder]:text-slate-400',
            size === 'sm' ? 'h-8' : 'h-10',
            hasError
              ? 'border-red-400 focus:border-red-400 focus:ring-red-200'
              : 'border-border focus:border-navy-500 focus:ring-navy-100',
          )}
        >
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon asChild>
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content
            position="popper"
            sideOffset={4}
            className={cn(
              'z-50 w-[var(--radix-select-trigger-width)] overflow-hidden',
              'rounded-md border border-border bg-white shadow-lg',
              'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
              'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
              'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
            )}
          >
            <RadixSelect.ScrollUpButton className="flex h-6 cursor-default items-center justify-center bg-white text-slate-500">
              <ChevronDown className="h-4 w-4 rotate-180" />
            </RadixSelect.ScrollUpButton>

            <RadixSelect.Viewport className="max-h-60 p-1">
              {options.map((option) => (
                <RadixSelect.Item
                  key={option.value || '__all__'}
                  value={option.value || '__all__'}
                  disabled={option.disabled}
                  className={cn(
                    'relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm',
                    'text-slate-700 outline-none',
                    'focus:bg-navy-50 focus:text-navy-700',
                    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                  )}
                >
                  <span className="absolute right-3 flex items-center">
                    <RadixSelect.ItemIndicator>
                      <Check className="h-4 w-4 text-navy-700" />
                    </RadixSelect.ItemIndicator>
                  </span>
                  <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>

            <RadixSelect.ScrollDownButton className="flex h-6 cursor-default items-center justify-center bg-white text-slate-500">
              <ChevronDown className="h-4 w-4" />
            </RadixSelect.ScrollDownButton>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>

      {hasError && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
