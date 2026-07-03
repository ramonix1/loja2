import { ThemeIconToggle } from '@lojao/ui';
import { testIds } from '@lojao/test-utils';

import { useAdminUiTheme } from '../lib/admin-ui-theme';

interface AdminUiThemeSwitchProps {
  className?: string;
  /** `true` na sidebar; `false` em telas auth full-screen (card destacado). */
  inset?: boolean;
}

/** Preferência local: paleta clara/escura Ata Commerce (login, hub e painel). */
export function AdminUiThemeSwitch({ className, inset = true }: AdminUiThemeSwitchProps) {
  const { theme, setTheme } = useAdminUiTheme();

  return (
    <ThemeIconToggle
      surface="admin"
      theme={theme}
      onToggle={() => setTheme(theme === 'claro' ? 'escuro' : 'claro')}
      testId={testIds.admin.uiThemeSwitch}
      className={
        className ??
        (inset
          ? undefined
          : 'border border-(--admin-border) bg-(--admin-surface) shadow-sm')
      }
    />
  );
}
