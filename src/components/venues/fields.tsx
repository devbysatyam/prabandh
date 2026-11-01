import type { FC, ReactNode } from 'react';
import { Field } from '../ui/Field';
import { parseIntField } from './helpers';

interface BaseProps {
  id: string;
  label: string;
  ariaLabel: string;
  className?: string | undefined;
}

interface TextFieldProps extends BaseProps {
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'date';
  placeholder?: string;
  required?: boolean;
}

/** Labelled single-line text (or date) input. */
export const TextField: FC<TextFieldProps> = ({
  id,
  label,
  ariaLabel,
  className,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
}) => (
  <Field htmlFor={id} label={label} className={className}>
    <input
      id={id}
      aria-label={ariaLabel}
      type={type}
      required={required}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="input-base text-xs"
    />
  </Field>
);

interface NumberFieldProps extends BaseProps {
  value: number;
  onChange: (value: number) => void;
  required?: boolean;
}

/** Labelled non-negative integer input. */
export const NumberField: FC<NumberFieldProps> = ({
  id,
  label,
  ariaLabel,
  className,
  value,
  onChange,
  required,
}) => (
  <Field htmlFor={id} label={label} className={className}>
    <input
      id={id}
      aria-label={ariaLabel}
      type="number"
      min={0}
      required={required}
      value={value}
      onChange={(e) => onChange(parseIntField(e.target.value))}
      className="input-base text-xs"
    />
  </Field>
);

interface TextAreaFieldProps extends BaseProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

/** Labelled two-row textarea. */
export const TextAreaField: FC<TextAreaFieldProps> = ({
  id,
  label,
  ariaLabel,
  className,
  value,
  onChange,
  placeholder,
}) => (
  <Field htmlFor={id} label={label} className={className}>
    <textarea
      id={id}
      aria-label={ariaLabel}
      rows={2}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="input-base text-xs resize-none"
    />
  </Field>
);

interface SelectFieldProps extends BaseProps {
  value: string | number;
  onChange: (value: string) => void;
  children: ReactNode;
}

/** Labelled select; options are passed as children. */
export const SelectField: FC<SelectFieldProps> = ({
  id,
  label,
  ariaLabel,
  className,
  value,
  onChange,
  children,
}) => (
  <Field htmlFor={id} label={label} className={className}>
    <select
      id={id}
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input-base text-xs"
    >
      {children}
    </select>
  </Field>
);
