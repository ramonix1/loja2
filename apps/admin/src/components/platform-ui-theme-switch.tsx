import { Switch } from '@lojao/ui';
import { testIds } from '@lojao/test-utils';

import { usePlatformUiTheme } from '../lib/platform-ui-theme';

interface PlatformUiThemeSwitchProps {
  className?: string;
  inset?: boolean;
}

/** Preferência local: paleta clara Ata Labs (verde/creme) no Platform Hub. */
export function PlatformUiThemeSwitch({ className, inset = true }: PlatformUiThemeSwitchProps) {
  const { theme, setTheme } = usePlatformUiTheme();
  const isClaro = theme === 'claro';

  return (
    <label
      className={
        className ??
        (inset
          ? 'mb-3 flex cursor-pointer items-center gap-3 px-3 py-2'
          : 'flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--platform-border)] bg-[var(--platform-surface)] px-3 py-2 shadow-sm')
      }
    >
      <Switch
        label="Tema claro do Platform Hub"
        checked={isClaro}
        onChange={(checked) => setTheme(checked ? 'claro' : 'escuro')}
        testId={testIds.platform.uiThemeSwitch}
        surface="platform"
      />
      <span className="text-sm text-[var(--platform-text-muted)]">Tema claro</span>
    </label>
  );
}
