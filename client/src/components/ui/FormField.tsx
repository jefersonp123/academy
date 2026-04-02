import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { Input } from './Input';

export interface FormFieldProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'date';
  placeholder?: string;
  disabled?: boolean;
  hint?: string;
}

export function FormField<T extends FieldValues>({
  name,
  control,
  label,
  type = 'text',
  placeholder,
  disabled,
  hint,
}: FormFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Input
          {...field}
          type={type}
          label={label}
          placeholder={placeholder}
          disabled={disabled}
          hint={hint}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}
