import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/lib/utils';
import {
  adminInputClass,
  platformInputClass,
  resolveSurface,
  type SidebarTheme,
  type UiSurface,
} from './surface';

export interface FieldNativeSelectProps extends ComponentProps<'select'> {
  surface?: UiSurface;
  /** @deprecated Use `surface`. */
  theme?: SidebarTheme;
  children: ReactNode;
}

/** Select nativo estilizado com tokens Ata (suporta option vazia). */
export function FieldNativeSelect({
  surface,
  theme,
  className,
  children,
  ...props
}: FieldNativeSelectProps) {
  const resolved = resolveSurface(surface, theme);
  const surfaceClass = resolved === 'platform' ? platformInputClass : adminInputClass;
  return (
    <select className={cn(surfaceClass(), className)} {...props}>
      {children}
    </select>
  );
}
