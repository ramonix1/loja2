import { useQuery } from '@tanstack/react-query';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { ApiError, apiFetch } from './api-client';
import { queryClient } from './query-client';

export interface AuthUser {
  id: number;
  nome: string;
  role: string;
}

interface MeResponse {
  data: { usuario: AuthUser; tenant: { slug?: string } };
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ME_KEY = ['auth', 'me'] as const;

async function fetchMe(): Promise<AuthUser | null> {
  try {
    const res = await apiFetch<MeResponse>('/api/v1/auth/me');
    return res.data.usuario;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const meQuery = useQuery({ queryKey: ME_KEY, queryFn: fetchMe });

  const value = useMemo<AuthContextValue>(() => {
    const user = meQuery.data ?? null;
    return {
      user,
      isLoading: meQuery.isLoading,
      isAuthenticated: !!user,
      login: async (email, senha) => {
        await apiFetch('/api/v1/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, senha }),
        });
        await queryClient.invalidateQueries({ queryKey: ME_KEY });
      },
      logout: async () => {
        await apiFetch('/api/v1/auth/logout', { method: 'POST' });
        queryClient.setQueryData(ME_KEY, null);
      },
    };
  }, [meQuery.data, meQuery.isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>.');
  return ctx;
}
