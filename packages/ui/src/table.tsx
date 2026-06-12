import type { TableHTMLAttributes } from 'react';

import { cn } from './cn';

export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-800">
      <table
        className={cn('w-full border-collapse text-left text-sm', className)}
        {...props}
      />
    </div>
  );
}
