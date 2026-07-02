import { IconButton } from './icon-button';
import { HiOutlineMoon, HiOutlineSun } from './icons';
import type { UiSurface } from './surface';

export type UiThemeMode = 'escuro' | 'claro';

export interface ThemeIconToggleProps {
  /** Tema ativo da superfície. */
  theme: UiThemeMode;
  /** Alterna entre escuro/claro (o pai resolve o próximo valor). */
  onToggle: () => void;
  /** Superfície de tokens: admin (Commerce) ou platform (Labs). */
  surface: Exclude<UiSurface, 'store'>;
  testId?: string;
  className?: string;
}

/**
 * Toggle de tema sol/lua (decisão D3 da spec dark-theme-icons).
 *
 * Substitui o `Switch` + label “Tema claro”. Estado escuro mostra o sol
 * (“Ativar tema claro”), estado claro mostra a lua (“Ativar tema escuro”),
 * sempre rotulando a ação resultante. Mantém o mesmo `testId` da versão
 * anterior para preservar os E2E.
 */
export function ThemeIconToggle({
  theme,
  onToggle,
  surface,
  testId,
  className,
}: ThemeIconToggleProps) {
  const isClaro = theme === 'claro';
  const label = isClaro ? 'Ativar tema escuro' : 'Ativar tema claro';
  const Icon = isClaro ? HiOutlineMoon : HiOutlineSun;

  return (
    <IconButton
      icon={<Icon />}
      label={label}
      onClick={onToggle}
      surface={surface}
      variant="ghost"
      size="lg"
      testId={testId}
      className={className}
    />
  );
}
