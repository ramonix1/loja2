import { Switch as ShadcnSwitch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { resolveSurface, type PanelSurface, type SidebarTheme } from './surface';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Rótulo acessível (aria-label). */
  label: string;
  testId?: string;
  disabled?: boolean;
  className?: string;
  surface?: PanelSurface;
  /** @deprecated Use `surface`. */
  theme?: SidebarTheme;
}

const TRACK_ON: Record<PanelSurface, string> = {
  admin: 'data-[state=checked]:bg-[var(--admin-switch-track-on)]',
  platform: 'data-[state=checked]:bg-[var(--platform-switch-track-on)]',
};

const TRACK_OFF: Record<PanelSurface, string> = {
  admin: 'data-[state=unchecked]:bg-[var(--admin-switch-track-off)]',
  platform: 'data-[state=unchecked]:bg-[var(--platform-switch-track-off)]',
};

/** Toggle acessível (Radix Switch via shadcn). */
export function Switch({
  checked,
  onChange,
  label,
  testId,
  disabled,
  className,
  surface,
  theme,
}: SwitchProps) {
  const resolved = resolveSurface(surface, theme);

  return (
    <ShadcnSwitch
      checked={checked}
      onCheckedChange={onChange}
      aria-label={label}
      data-testid={testId}
      disabled={disabled}
      className={cn(
        'h-6 w-11 shrink-0 touch-manipulation data-[size=default]:h-6 data-[size=default]:w-11',
        TRACK_ON[resolved],
        TRACK_OFF[resolved],
        '[&_[data-slot=switch-thumb]]:size-5 [&_[data-slot=switch-thumb]]:data-[state=checked]:translate-x-5',
        disabled && 'pointer-events-none opacity-40',
        className,
      )}
    />
  );
}
