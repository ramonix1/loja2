import type { ButtonHTMLAttributes } from 'react';

import { cn } from './cn';

type Variant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50',
  secondary: 'bg-gray-700 text-gray-100 hover:bg-gray-600 disabled:opacity-50',
  ghost: 'bg-transparent text-gray-300 hover:bg-gray-800',
};

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed',
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
