import { ThemeIconToggle } from '@lojao/ui';
import { testIds } from '@lojao/test-utils';

import { usePlatformUiTheme } from '../lib/platform-ui-theme';

interface PlatformUiThemeSwitchProps {
  className?: string;
  inset?: boolean;
}

/** Preferência local: paleta clara/escura Ata Labs (verde/creme) no Platform Hub. */
export function PlatformUiThemeSwitch({ className, inset = true }: PlatformUiThemeSwitchProps) {
  const { theme, setTheme } = usePlatformUiTheme();

  return (
    <ThemeIconToggle
      surface="platform"
      theme={theme}
      onToggle={() => setTheme(theme === 'claro' ? 'escuro' : 'claro')}
      testId={testIds.platform.uiThemeSwitch}
      className={
        className ??
        (inset
          ? undefined
          : 'border border-(--platform-border) bg-(--platform-surface) shadow-sm')
      }
    />
  );
}
