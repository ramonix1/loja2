import type { ComponentProps } from 'react';

import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { mobileControlExtras } from './control-styles';
import { resolveSurface, type SidebarTheme, type UiSurface } from './surface';

export interface FieldTextareaProps extends ComponentProps<'textarea'> {
  surface?: UiSurface;
  /** @deprecated Use `surface`. */
  theme?: SidebarTheme;
}

/** Textarea shadcn com tokens Ata por surface (via bridge CSS). */
export function FieldTextarea({ surface, theme, className, ...props }: FieldTextareaProps) {
  resolveSurface(surface, theme);
  return (
    <Textarea className={cn(mobileControlExtras, 'min-h-[5rem]', className)} {...props} />
  );
}
