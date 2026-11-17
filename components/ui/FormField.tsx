import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

const base =
  'block w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/25 disabled:bg-slate-50';

function cls(error?: string) {
  return `${base} ${error ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-brand'}`;
}

interface FieldProps {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}

function Field({ label, name, error, hint, required, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-accent-ink"> *</span>}
      </label>
      {children}
      {error ? (
        <p id={`${name}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
}

type Common = { label: string; name: string; error?: string; hint?: string };

export function Input({ label, name, error, hint, ...props }: Common & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label} name={name} error={error} hint={hint} required={props.required}>
      <input id={name} name={name} aria-invalid={!!error} aria-describedby={error ? `${name}-error` : undefined} className={cls(error)} {...props} />
    </Field>
  );
}

export function Select({ label, name, error, hint, children, ...props }: Common & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Field label={label} name={name} error={error} hint={hint} required={props.required}>
      <select id={name} name={name} aria-invalid={!!error} className={cls(error)} {...props}>
        {children}
      </select>
    </Field>
  );
}

export function Textarea({ label, name, error, hint, ...props }: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Field label={label} name={name} error={error} hint={hint} required={props.required}>
      <textarea id={name} name={name} rows={3} aria-invalid={!!error} className={cls(error)} {...props} />
    </Field>
  );
}
