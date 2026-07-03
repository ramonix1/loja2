import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/lib/utils';
import {
  adminNativeSelectClass,
  platformNativeSelectClass,
  resolveSurface,
  storeNativeSelectClass,
  type SidebarTheme,
  type UiSurface,
} from './surface';

export interface FieldNativeSelectProps extends ComponentProps<'select'> {
  surface?: UiSurface;
  /** @deprecated Use `surface`. */
  theme?: SidebarTheme;
  children: ReactNode;
}

/** Select nativo com aparência shadcn SelectTrigger (suporta option vazia). */
export function FieldNativeSelect({
  surface,
  theme,
  className,
  children,
  ...props
}: FieldNativeSelectProps) {
  const resolved = surface === 'store' ? 'store' : resolveSurface(surface, theme);
  const surfaceClass =
    resolved === 'store'
      ? storeNativeSelectClass
      : resolved === 'platform'
        ? platformNativeSelectClass
        : adminNativeSelectClass;

  return (
    <select className={cn(surfaceClass(), className)} {...props}>
      {children}
    </select>
  );
}
