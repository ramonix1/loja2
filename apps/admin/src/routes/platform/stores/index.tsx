import {
  Button,
  FieldInput,
  FieldSelect,
  FieldSelectItem,
  PageToolbar,
  PageToolbarEnd,
  PageToolbarStart,
  PaginationBar,
  PlatformStoreCard,
  ViewToggle,
  platformMutedClass,
  cn,
  type ViewMode,
} from '@lojao/ui';
import { ActionIcons } from '@lojao/ui/icons';
import { testIds } from '@lojao/test-utils';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { EditIconButton, ViewIconButton } from '../../../components/crud-icon-buttons';
import { listPlatformStoresPaginated } from '../../../lib/platform-api';
import { storefrontUrlForSlug } from '../../../lib/api-client';
import type { PlatformStoreListItem } from '@lojao/types/platform';

const VIEW_MODE_KEY = 'platform-stores-view-mode';

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export function PlatformStoresPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '');
  const debouncedSearch = useDebouncedValue(search, 300);
  const statusParam = searchParams.get('status');
  const status =
    statusParam === 'active' || statusParam === 'suspended' ? statusParam : undefined;
  const planoParam = searchParams.get('plano');
  const plano =
    planoParam === 'starter' || planoParam === 'professional' || planoParam === 'enterprise'
      ? planoParam
      : undefined;
  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const perPage = 20;

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem(VIEW_MODE_KEY) as ViewMode | null) ?? 'grid';
  });

  const persistViewMode = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(VIEW_MODE_KEY, mode);
  }, []);

  const updateParams = useCallback(
    (patch: Record<string, string | null>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, val] of Object.entries(patch)) {
          if (val == null || val === '') next.delete(key);
          else next.set(key, val);
        }
        return next;
      });
    },
    [setSearchParams],
  );

  useEffect(() => {
    const current = searchParams.get('q') ?? '';
    if (debouncedSearch === current) return;
    updateParams({ q: debouncedSearch || null, page: null });
  }, [debouncedSearch, searchParams, updateParams]);

  const queryKey = useMemo(
    () => ['platform', 'stores', { q: debouncedSearch, status, plano, page, perPage }],
    [debouncedSearch, status, plano, page, perPage],
  );

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      listPlatformStoresPaginated({
        q: debouncedSearch || undefined,
        status,
        plano,
        page,
        limit: perPage,
      }),
  });

  const items = data?.items ?? [];
  const total = data?.meta.total ?? 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-bold text-[var(--platform-text)]">Lojas</h1>
        <p className={cn('text-sm', platformMutedClass())}>Gerencie as lojas da plataforma.</p>
      </div>

      <div className="mb-6" data-testid={testIds.platform.storesToolbar}>
        <PageToolbar>
          <PageToolbarStart>
            <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
              <ActionIcons.search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--platform-text-muted)]"
                aria-hidden
              />
              <FieldInput
                surface="platform"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar loja, slug, merchant…"
                className="pl-9"
                data-testid={testIds.platform.storesSearch}
              />
            </div>
            <FieldSelect
              surface="platform"
              value={status ?? ''}
              emptyLabel="Todas"
              triggerClassName="sm:max-w-[10rem]"
              onValueChange={(v) =>
                updateParams({
                  status: v || null,
                  page: null,
                })
              }
              data-testid={testIds.platform.storesFilterStatus}
            >
              <FieldSelectItem value="active">Ativas</FieldSelectItem>
              <FieldSelectItem value="suspended">Suspensas</FieldSelectItem>
            </FieldSelect>
            <FieldSelect
              surface="platform"
              value={plano ?? ''}
              emptyLabel="Todos os planos"
              triggerClassName="sm:max-w-[10rem]"
              onValueChange={(v) =>
                updateParams({
                  plano: v || null,
                  page: null,
                })
              }
              data-testid={testIds.platform.storesFilterPlano}
            >
              <FieldSelectItem value="starter">Starter</FieldSelectItem>
              <FieldSelectItem value="professional">Professional</FieldSelectItem>
              <FieldSelectItem value="enterprise">Enterprise</FieldSelectItem>
            </FieldSelect>
            <ViewToggle value={viewMode} onChange={persistViewMode} />
          </PageToolbarStart>
          <PageToolbarEnd>
            <Link to="/platform/stores/novo" data-testid={testIds.platform.storeCreateLink}>
              <Button surface="platform">
                <ActionIcons.add className="mr-2 inline size-5" aria-hidden />
                Nova loja
              </Button>
            </Link>
          </PageToolbarEnd>
        </PageToolbar>
      </div>

      {isLoading ? (
        <div className={cn('py-12 text-center text-sm', platformMutedClass())}>Carregando…</div>
      ) : items.length === 0 ? (
        <div
          data-testid={testIds.platform.storesEmpty}
          className={cn(
            'rounded-xl border border-dashed border-[var(--platform-border)] py-16 text-center',
            platformMutedClass(),
          )}
        >
          <p className="mb-4">Nenhuma loja encontrada.</p>
          <Link to="/platform/stores/novo">
            <Button surface="platform">Crie sua primeira loja</Button>
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        <div
          data-testid={testIds.platform.storesList}
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {items.map((store: PlatformStoreListItem) => (
            <PlatformStoreCard
              key={store.slug}
              slug={store.slug}
              nome={store.nome}
              plano={store.plano}
              merchantName={store.merchantName}
              ativo={store.ativo}
              health={store.health}
              vitrineHref={storefrontUrlForSlug(store.slug)}
              testId={testIds.platform.storeCard(store.slug)}
              editAction={
                <Link
                  to={`/platform/stores/${store.slug}`}
                  className="inline-flex min-h-12 flex-1 touch-manipulation items-center justify-center rounded-lg bg-[var(--platform-accent)] px-4 text-sm font-medium text-white hover:bg-[var(--platform-accent-hover)]"
                >
                  Editar loja
                </Link>
              }
            />
          ))}
        </div>
      ) : (
        <div data-testid={testIds.platform.storesList} className="space-y-3">
          {items.map((store: PlatformStoreListItem) => (
            <div
              key={store.slug}
              data-testid={testIds.platform.storesRow(store.slug)}
              className="platform-store-row"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-semibold text-[var(--platform-text)]">
                    {store.nome}
                  </span>
                  {!store.ativo && <span className="ds-badge-suspended">suspensa</span>}
                </div>
                <div className={cn('mt-0.5 text-xs', platformMutedClass())}>
                  /store/{store.slug}
                  {store.plano ? ` · ${store.plano}` : ''}
                  {store.merchantName ? ` · ${store.merchantName}` : ''}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <ViewIconButton
                  href={storefrontUrlForSlug(store.slug)}
                  external
                  surface="platform"
                  label="Ver vitrine"
                />
                <EditIconButton
                  to={`/platform/stores/${store.slug}`}
                  surface="platform"
                  label="Detalhes da loja"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {total > perPage ? (
        <div className="mt-6">
          <PaginationBar
            page={page}
            perPage={perPage}
            total={total}
            onPageChange={(p) => updateParams({ page: p > 1 ? String(p) : null })}
            surface="platform"
          />
        </div>
      ) : null}
    </div>
  );
}
