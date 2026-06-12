import type { HTMLAttributes, ReactNode } from 'react';

import { Card } from './card';
import { cn } from './cn';

export interface ChartCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode;
  subtitle?: ReactNode;
}

/** Wrapper Card + título para gráficos (Recharts fica no app admin). */
export function ChartCard({ title, subtitle, className, children, ...props }: ChartCardProps) {
  return (
    <Card className={cn('flex flex-col', className)} {...props}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {subtitle != null && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
      </div>
      <div className="min-h-[280px] flex-1">{children}</div>
    </Card>
  );
}
