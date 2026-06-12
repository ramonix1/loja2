import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from './cn';

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
}

export function Card({ title, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm',
        className,
      )}
      {...props}
    >
      {title != null && (
        <div className="mb-1 text-sm font-medium text-gray-400">{title}</div>
      )}
      {children}
    </div>
  );
}
