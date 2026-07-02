import { useQuery } from '@tanstack/react-query';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { ApiError, apiFetch, setSessionStoreSlug } from './api-client';
import { endPlatformImpersonation } from './platform-api';
import { queryClient, resetStoreScopedQueries } from './query-client';

export interface AuthUser {
  id?: number;
  nome: string;
  email?: string;
  role: string;
}

/** Loja ativa na sessão do lojista. */
export interface AuthStore {
  slug: string;
  lojaNome: string;
}

export interface AuthMerchant {
  slug: string;
  nome: string;
}

export type LoginStep = 'ready' | 'select_store';

interface MeResponse {
  data: {
    usuario: AuthUser;
    merchant?: { slug: string; nome: string } | null;
    store?: { slug: string; nome: string } | null;
    impersonation?: { storeSlug: string; operatorEmail: string } | null;
  };
}

const MERCHANT_ROLES = new Set(['owner', 'admin', 'operator']);

function isMerchantUser(user: AuthUser | null | undefined): boolean {
  return !!user && MERCHANT_ROLES.has(user.role);
}

function isAdminAppUser(user: AuthUser | null | undefined, isPlatformAdmin: boolean): boolean {
  return isPlatformAdmin || isMerchantUser(user);
}

interface LoginResponse {
  data: {
    step: LoginStep;
    merchant?: { slug: string; nome: string };
    store?: { slug: string; nome: string };
    stores?: Array<{ slug: string; nome?: string }>;
    user: AuthUser;
  };
}

interface AuthContextValue {
  user: AuthUser | null;
  store: AuthStore | null;
  merchant: AuthMerchant | null;
  impersonation: { storeSlug: string; operatorEmail: string } | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsStoreSelection: boolean;
  isPlatformAdmin: boolean;
  login: (email: string, senha: string) => Promise<LoginStep>;
  selectStore: (storeSlug: string) => Promise<void>;
  clearStoreForSwitch: () => Promise<void>;
  platformLogin: (email: string, senha: string) => Promise<void>;
  endImpersonation: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ME_KEY = ['auth', 'me'] as const;

async function fetchMe(): Promise<{
  user: AuthUser;
  store: AuthStore | null;
  merchant: AuthMerchant | null;
  impersonation: { storeSlug: string; operatorEmail: string } | null;
} | null> {
  try {
    const res = await apiFetch<MeResponse>('/api/v1/auth/me');
    const user = res.data.usuario;

    if (user.role === 'platform_admin') {
      setSessionStoreSlug(null);
      return { user, store: null, merchant: null, impersonation: null };
    }

    const merchant = res.data.merchant
      ? { slug: res.data.merchant.slug, nome: res.data.merchant.nome }
      : null;

    const storeSlug = res.data.store?.slug;
    if (!storeSlug) {
      setSessionStoreSlug(null);
      return {
        user,
        store: null,
        merchant,
        impersonation: res.data.impersonation ?? null,
      };
    }

    const store: AuthStore = {
      slug: storeSlug,
      lojaNome: res.data.store?.nome ?? storeSlug,
    };
    setSessionStoreSlug(storeSlug);
    return {
      user,
      store,
      merchant,
      impersonation: res.data.impersonation ?? null,
    };
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      setSessionStoreSlug(null);
      return null;
    }
    throw err;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const meQuery = useQuery({ queryKey: ME_KEY, queryFn: fetchMe });

  const value = useMemo<AuthContextValue>(() => {
    const user = meQuery.data?.user ?? null;
    const store = meQuery.data?.store ?? null;
    const merchant = meQuery.data?.merchant ?? null;
    const impersonation = meQuery.data?.impersonation ?? null;
    const isPlatformAdmin = user?.role === 'platform_admin';
    const needsStoreSelection =
      isMerchantUser(user) && !store;

    return {
      user,
      store,
      merchant,
      impersonation,
      isLoading: meQuery.isLoading,
      isAuthenticated: isAdminAppUser(user, isPlatformAdmin),
      needsStoreSelection,
      isPlatformAdmin,
      login: async (email, senha) => {
        const res = await apiFetch<LoginResponse>('/api/v1/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, senha }),
        });
        resetStoreScopedQueries();
        await queryClient.invalidateQueries({ queryKey: ME_KEY });
        return res.data.step;
      },
      selectStore: async (storeSlug) => {
        await apiFetch('/api/v1/auth/select-store', {
          method: 'POST',
          body: JSON.stringify({ storeSlug }),
        });
        setSessionStoreSlug(storeSlug);
        resetStoreScopedQueries();
        await queryClient.invalidateQueries({ queryKey: ME_KEY });
      },
      clearStoreForSwitch: async () => {
        await apiFetch('/api/v1/auth/clear-store', { method: 'POST' });
        setSessionStoreSlug(null);
        resetStoreScopedQueries();
        await queryClient.invalidateQueries({ queryKey: ME_KEY });
      },
      platformLogin: async (email, senha) => {
        await apiFetch('/api/v1/platform/login', {
          method: 'POST',
          body: JSON.stringify({ email, senha }),
        });
        await queryClient.invalidateQueries({ queryKey: ME_KEY });
      },
      endImpersonation: async () => {
        await endPlatformImpersonation();
        setSessionStoreSlug(null);
        resetStoreScopedQueries();
        await queryClient.invalidateQueries({ queryKey: ME_KEY });
        window.location.href = '/platform/stores';
      },
      logout: async () => {
        await apiFetch('/api/v1/auth/logout', { method: 'POST' });
        setSessionStoreSlug(null);
        resetStoreScopedQueries();
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
