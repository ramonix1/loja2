import type { ComponentProps } from 'react';

import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  adminInputClass,
  platformInputClass,
  resolveSurface,
  type SidebarTheme,
  type UiSurface,
} from './surface';

export interface FieldTextareaProps extends ComponentProps<'textarea'> {
  surface?: UiSurface;
  /** @deprecated Use `surface`. */
  theme?: SidebarTheme;
}

/** Textarea shadcn com tokens Ata por surface. */
export function FieldTextarea({ surface, theme, className, ...props }: FieldTextareaProps) {
  const resolved = resolveSurface(surface, theme);
  const surfaceClass = resolved === 'platform' ? platformInputClass : adminInputClass;
  return <Textarea className={cn(surfaceClass(), 'min-h-[5rem]', className)} {...props} />;
}
