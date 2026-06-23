import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type PlatformUiTheme = 'escuro' | 'claro';

const STORAGE_KEY = 'ata-platform-ui-theme';

interface PlatformUiThemeContextValue {
  theme: PlatformUiTheme;
  setTheme: (theme: PlatformUiTheme) => void;
}

const PlatformUiThemeContext = createContext<PlatformUiThemeContextValue | null>(null);

function readStoredTheme(): PlatformUiTheme {
  if (typeof window === 'undefined') return 'escuro';
  return window.localStorage.getItem(STORAGE_KEY) === 'claro' ? 'claro' : 'escuro';
}

export function PlatformUiThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<PlatformUiTheme>(() => {
    const initial = readStoredTheme();
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.platformUiTheme = initial;
    }
    return initial;
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, theme);
    document.documentElement.dataset.platformUiTheme = theme;
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return (
    <PlatformUiThemeContext.Provider value={value}>{children}</PlatformUiThemeContext.Provider>
  );
}

export function usePlatformUiTheme(): PlatformUiThemeContextValue {
  const ctx = useContext(PlatformUiThemeContext);
  if (!ctx) {
    throw new Error('usePlatformUiTheme deve ser usado dentro de PlatformUiThemeProvider.');
  }
  return ctx;
}
