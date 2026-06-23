import { Button, adminMutedClass, cn } from '@lojao/ui';
import { testIds } from '@lojao/test-utils';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { AdminUiThemeSwitch } from '../components/admin-ui-theme-switch';
import { AtaCommerceBrand, merchantHubShellClass } from '../components/ata-brand';
import { ApiError, apiFetch } from '../lib/api-client';
import { useAuth } from '../lib/auth-context';
import { queryClient } from '../lib/query-client';

interface StoreSummary {
  slug: string;
  lojaNome: string;
}

interface MyStoresResponse {
  data: { stores: StoreSummary[] };
}

const STOREFRONT_HOST = (import.meta.env.VITE_STOREFRONT_URL ?? 'http://localhost:3000').replace(
  /\/$/,
  '',
);

function storeVitrineLabel(slug: string): string {
  return `${STOREFRONT_HOST.replace(/^https?:\/\//, '')}/store/${slug}`;
}

export function MyStoresPage() {
  const { user, tenant, logout, selectTenant, clearTenantForSwitch, isLoading } = useAuth();
  const navigate = useNavigate();

  /** Evita limpar tenant após `select-tenant` — só na chegada com loja já ativa ("Trocar loja"). */
  const hubInitDone = useRef(false);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [isLoading, user, navigate]);

  useEffect(() => {
    if (isLoading || !user || hubInitDone.current) return;
    hubInitDone.current = true;

    if (tenant) {
      void clearTenantForSwitch();
    }
  }, [isLoading, user, tenant, clearTenantForSwitch]);

  const storesQuery = useQuery({
    queryKey: ['auth', 'my-stores'],
    queryFn: () => apiFetch<MyStoresResponse>('/api/v1/auth/my-stores'),
    enabled: !!user && !tenant,
  });

  const selectMutation = useMutation({
    mutationFn: (slug: string) => selectTenant(slug),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['auth', 'my-stores'] });
      navigate('/admin/dashboard', { replace: true });
    },
  });

  const stores = storesQuery.data?.data.stores ?? [];

  if (isLoading || !user) {
    return (
      <div className={cn(merchantHubShellClass(), 'items-center justify-center', adminMutedClass())}>
        Carregando…
      </div>
    );
  }

  return (
    <div className={merchantHubShellClass()} data-testid={testIds.merchantHub.page}>
      <header className="shrink-0 border-b border-[var(--admin-border)] px-4 pb-5 pt-6 sm:px-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <AtaCommerceBrand subtitle="Painel do lojista" className="mb-0" />
          <AdminUiThemeSwitch inset={false} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--admin-text)] sm:text-3xl">
          Minhas lojas
        </h1>
        <p className={cn('mt-2 max-w-2xl text-base', adminMutedClass())}>
          Olá, <span className="font-medium text-[var(--admin-text)]">{user.nome}</span>. Toque na
          loja que você quer administrar.
        </p>
      </header>

      <main className="flex flex-1 flex-col px-4 py-6 sm:px-6">
        {storesQuery.isLoading && (
          <p className={cn('text-base', adminMutedClass())}>Carregando lojas…</p>
        )}

        {storesQuery.error && (
          <p className="ds-alert-error text-base">
            {storesQuery.error instanceof ApiError
              ? storesQuery.error.message
              : 'Não foi possível carregar suas lojas.'}
          </p>
        )}

        {!storesQuery.isLoading && stores.length === 0 && (
          <div
            className={cn(
              'flex flex-1 flex-col items-start justify-center gap-4 rounded-2xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 text-base',
              adminMutedClass(),
            )}
          >
            <p>Nenhuma loja encontrada para sua conta.</p>
            <a
              href="mailto:suporte@atalabs.com.br"
              className="inline-flex min-h-12 touch-manipulation items-center rounded-xl bg-[var(--admin-sidebar-active-bg)] px-5 font-medium text-[var(--admin-link)] hover:bg-[var(--admin-sidebar-hover-bg)]"
            >
              Falar com suporte
            </a>
          </div>
        )}

        {stores.length > 0 && (
          <div
            className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
            data-testid={testIds.merchantHub.storeList}
          >
            {stores.map((store) => (
              <article
                key={store.slug}
                className="admin-hub-card"
                data-testid={testIds.merchantHub.storeCard(store.slug)}
              >
                <div className="mb-5 flex items-center gap-4">
                  <div className="admin-hub-avatar" aria-hidden>
                    {store.lojaNome.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-lg font-semibold text-[var(--admin-text)] sm:text-xl">
                      {store.lojaNome}
                    </h2>
                    <p className={cn('mt-1 truncate text-sm', adminMutedClass())}>
                      {storeVitrineLabel(store.slug)}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  surface="admin"
                  disabled={selectMutation.isPending}
                  data-testid={testIds.merchantHub.selectStore(store.slug)}
                  className="mt-auto min-h-12 w-full touch-manipulation text-base active:scale-[0.98]"
                  onClick={() => selectMutation.mutate(store.slug)}
                >
                  {selectMutation.isPending ? 'Abrindo…' : 'Entrar na loja'}
                </Button>
              </article>
            ))}
          </div>
        )}
      </main>

      <footer className="shrink-0 border-t border-[var(--admin-border)] px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
        <button
          type="button"
          onClick={async () => {
            await logout();
            navigate('/login', { replace: true });
          }}
          className="min-h-12 w-full touch-manipulation rounded-xl text-center text-base text-[var(--admin-text-muted)] hover:bg-[var(--admin-sidebar-hover-bg)] hover:text-[var(--admin-link)]"
        >
          Sair da conta
        </button>
      </footer>
    </div>
  );
}
