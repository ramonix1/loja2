import { useQuery } from '@tanstack/react-query';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { ApiError, apiFetch, setSessionTenantSlug } from './api-client';
import { queryClient } from './query-client';

export interface AuthUser {
  id?: number;
  nome: string;
  email?: string;
  role: string;
}

export interface AuthTenant {
  slug: string;
  lojaNome: string;
}

export type LoginStep = 'ready' | 'select_tenant';

interface MeResponse {
  data: {
    usuario: AuthUser;
    tenant: { slug?: string; lojaNome?: string } | null;
  };
}

interface LoginResponse {
  data: {
    step: LoginStep;
    tenant?: { slug: string; lojaNome: string };
    stores?: Array<{ slug: string; lojaNome: string }>;
    user: AuthUser;
  };
}

interface AuthContextValue {
  user: AuthUser | null;
  tenant: AuthTenant | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsTenantSelection: boolean;
  isPlatformAdmin: boolean;
  login: (email: string, senha: string) => Promise<LoginStep>;
  selectTenant: (tenantSlug: string) => Promise<void>;
  clearTenantForSwitch: () => Promise<void>;
  platformLogin: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ME_KEY = ['auth', 'me'] as const;

async function fetchMe(): Promise<{ user: AuthUser; tenant: AuthTenant | null } | null> {
  try {
    const res = await apiFetch<MeResponse>('/api/v1/auth/me');
    const user = res.data.usuario;

    if (user.role === 'platform_admin') {
      setSessionTenantSlug(null);
      return { user, tenant: null };
    }

    const slug = res.data.tenant?.slug;
    if (!slug) {
      setSessionTenantSlug(null);
      return { user, tenant: null };
    }

    const tenant: AuthTenant = {
      slug,
      lojaNome: res.data.tenant?.lojaNome ?? slug,
    };
    setSessionTenantSlug(slug);
    return { user, tenant };
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      setSessionTenantSlug(null);
      return null;
    }
    throw err;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const meQuery = useQuery({ queryKey: ME_KEY, queryFn: fetchMe });

  const value = useMemo<AuthContextValue>(() => {
    const user = meQuery.data?.user ?? null;
    const tenant = meQuery.data?.tenant ?? null;
    const needsTenantSelection = !!user && user.role === 'admin' && !tenant;

    return {
      user,
      tenant,
      isLoading: meQuery.isLoading,
      isAuthenticated: !!user,
      needsTenantSelection,
      isPlatformAdmin: user?.role === 'platform_admin',
      login: async (email, senha) => {
        const res = await apiFetch<LoginResponse>('/api/v1/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, senha }),
        });
        await queryClient.invalidateQueries({ queryKey: ME_KEY });
        return res.data.step;
      },
      selectTenant: async (tenantSlug) => {
        await apiFetch('/api/v1/auth/select-tenant', {
          method: 'POST',
          body: JSON.stringify({ tenantSlug }),
        });
        setSessionTenantSlug(tenantSlug);
        await queryClient.invalidateQueries({ queryKey: ME_KEY });
      },
      clearTenantForSwitch: async () => {
        await apiFetch('/api/v1/auth/clear-tenant', { method: 'POST' });
        setSessionTenantSlug(null);
        await queryClient.invalidateQueries({ queryKey: ME_KEY });
      },
      platformLogin: async (email, senha) => {
        await apiFetch('/api/v1/platform/login', {
          method: 'POST',
          body: JSON.stringify({ email, senha }),
        });
        await queryClient.invalidateQueries({ queryKey: ME_KEY });
      },
      logout: async () => {
        await apiFetch('/api/v1/auth/logout', { method: 'POST' });
        setSessionTenantSlug(null);
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
