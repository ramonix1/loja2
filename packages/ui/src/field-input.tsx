import type { ComponentProps } from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  adminInputClass,
  platformInputClass,
  storeInputClass,
  resolveSurface,
  type SidebarTheme,
  type UiSurface,
} from './surface';

export interface FieldInputProps extends ComponentProps<'input'> {
  surface?: UiSurface;
  /** @deprecated Use `surface`. */
  theme?: SidebarTheme;
}

/** Input shadcn com tokens Ata por surface. */
export function FieldInput({ surface, theme, className, ...props }: FieldInputProps) {
  const resolved = resolveSurface(surface, theme);
  const surfaceClass =
    surface === 'store'
      ? storeInputClass
      : resolved === 'platform'
        ? platformInputClass
        : adminInputClass;
  return <Input className={cn(surfaceClass(), className)} {...props} />;
}
