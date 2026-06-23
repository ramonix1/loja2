import type { HTMLAttributes, ReactNode } from 'react';

import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Card } from './card';
import { cn } from './cn';
import { resolveSurface, type SidebarTheme, type UiSurface } from './surface';

export interface ChartCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode;
  subtitle?: ReactNode;
  surface?: UiSurface;
  /** @deprecated Use `surface`. */
  theme?: SidebarTheme;
}

/** Wrapper Card shadcn + título para gráficos (Recharts fica no app admin). */
export function ChartCard({
  title,
  subtitle,
  surface,
  theme,
  className,
  children,
  ...props
}: ChartCardProps) {
  const resolved = resolveSurface(surface, theme);

  return (
    <Card className={cn('flex flex-col gap-4', className)} surface={resolved} {...props}>
      <CardHeader className="gap-1 p-0">
        <CardTitle
          className={cn(
            'text-sm font-semibold',
            resolved === 'admin' ? 'text-[var(--admin-text)]' : 'text-[var(--platform-text)]',
          )}
        >
          {title}
        </CardTitle>
        {subtitle != null && (
          <CardDescription
            className={cn(
              'text-xs',
              resolved === 'admin'
                ? 'text-[var(--admin-text-subtle)]'
                : 'text-[var(--platform-text-subtle)]',
            )}
          >
            {subtitle}
          </CardDescription>
        )}
      </CardHeader>
      <div className="min-h-[280px] flex-1">{children}</div>
    </Card>
  );
}
