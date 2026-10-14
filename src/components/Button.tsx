import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg' | 'xl-kiosk';

const variants: Record<Variant, string> = {
  primary: 'bg-sky-600 text-white hover:bg-sky-700',
  secondary: 'bg-slate-700 text-white hover:bg-slate-800',
  accent: 'bg-amber-400 text-slate-900 hover:bg-amber-500',
  ghost: 'bg-transparent border border-slate-200 text-slate-700 hover:bg-slate-100',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-base font-semibold',
  'xl-kiosk': 'px-8 py-4 text-xl font-bold min-h-[48px]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  className,
  children,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean }) {
  return (
    <button
      className={cn('rounded-md transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2', variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? 'Memproses…' : children}
    </button>
  );
}
