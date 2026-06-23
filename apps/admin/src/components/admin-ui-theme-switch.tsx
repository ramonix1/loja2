import { Switch } from '@lojao/ui';
import { testIds } from '@lojao/test-utils';

import { useAdminUiTheme } from '../lib/admin-ui-theme';

interface AdminUiThemeSwitchProps {
  className?: string;
  /** Padding lateral padrão da sidebar; desligue em telas auth full-screen. */
  inset?: boolean;
}

/** Preferência local: paleta clara Ata Commerce (login, hub e painel). */
export function AdminUiThemeSwitch({ className, inset = true }: AdminUiThemeSwitchProps) {
  const { theme, setTheme } = useAdminUiTheme();
  const isClaro = theme === 'claro';

  return (
    <label
      className={
        className ??
        (inset
          ? 'mb-3 flex cursor-pointer items-center gap-3 px-3 py-2'
          : 'flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 shadow-sm')
      }
    >
      <Switch
        label="Tema claro do painel"
        checked={isClaro}
        onChange={(checked) => setTheme(checked ? 'claro' : 'escuro')}
        testId={testIds.admin.uiThemeSwitch}
        surface="admin"
      />
      <span className="text-sm text-[var(--admin-text-muted)]">Tema claro</span>
    </label>
  );
}
