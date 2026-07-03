import type { ComponentProps } from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { mobileControlExtras, storeControlShape, storeSurfaceControlExtras } from './control-styles';
import { resolveSurface, type SidebarTheme, type UiSurface } from './surface';

export interface FieldInputProps extends ComponentProps<'input'> {
  surface?: UiSurface;
  /** @deprecated Use `surface`. */
  theme?: SidebarTheme;
}

/** Input shadcn com tokens Ata por surface (via bridge CSS). */
export function FieldInput({ surface, theme, className, ...props }: FieldInputProps) {
  const resolved = surface === 'store' ? 'store' : resolveSurface(surface, theme);
  return (
    <Input
      className={cn(
        mobileControlExtras,
        resolved === 'store' && storeControlShape,
        resolved === 'store' && storeSurfaceControlExtras,
        className,
      )}
      {...props}
    />
  );
}
