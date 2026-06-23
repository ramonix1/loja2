import type { HTMLAttributes, ReactNode } from 'react';

import {
  Card as ShadcnCard,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { resolveSurface, type SidebarTheme, type UiSurface } from './surface';

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  surface?: UiSurface;
  /** @deprecated Use `surface`. */
  theme?: SidebarTheme;
}

export function Card({
  title,
  surface: _surface,
  theme,
  className,
  children,
  ...props
}: CardProps) {
  resolveSurface(_surface, theme);

  return (
    <ShadcnCard className={cn('gap-1 p-5 shadow-sm', className)} {...props}>
      {title != null && (
        <CardHeader className="gap-0 p-0">
          <CardDescription className="mb-1 text-sm font-medium">{title}</CardDescription>
        </CardHeader>
      )}
      {children}
    </ShadcnCard>
  );
}
