import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type AdminUiTheme = 'escuro' | 'claro';

const STORAGE_KEY = 'ata-admin-ui-theme';

interface AdminUiThemeContextValue {
  theme: AdminUiTheme;
  setTheme: (theme: AdminUiTheme) => void;
}

const AdminUiThemeContext = createContext<AdminUiThemeContextValue | null>(null);

function readStoredTheme(): AdminUiTheme {
  if (typeof window === 'undefined') return 'escuro';
  return window.localStorage.getItem(STORAGE_KEY) === 'claro' ? 'claro' : 'escuro';
}

export function AdminUiThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<AdminUiTheme>(() => {
    const initial = readStoredTheme();
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.adminUiTheme = initial;
    }
    return initial;
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, theme);
    document.documentElement.dataset.adminUiTheme = theme;
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return <AdminUiThemeContext.Provider value={value}>{children}</AdminUiThemeContext.Provider>;
}

export function useAdminUiTheme(): AdminUiThemeContextValue {
  const ctx = useContext(AdminUiThemeContext);
  if (!ctx) {
    throw new Error('useAdminUiTheme deve ser usado dentro de AdminUiThemeProvider.');
  }
  return ctx;
}
