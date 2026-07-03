import {
  FieldInput,
  FieldSelect,
  FieldSelectItem,
  PageToolbar,
  PageToolbarStart,
  PaginationBar,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  platformMutedClass,
  cn,
} from '@lojao/ui';
import { ActionIcons } from '@lojao/ui/icons';
import { testIds } from '@lojao/test-utils';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { listPlatformMerchantsPaginated } from '../../../lib/platform-api';
import type { PlatformMerchantListItem } from '@lojao/types/platform';

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export function PlatformMerchantsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '');
  const debouncedSearch = useDebouncedValue(search, 300);
  const statusParam = searchParams.get('status');
  const status =
    statusParam === 'active' || statusParam === 'suspended' ? statusParam : undefined;
  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const perPage = 20;

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
    () => ['platform', 'merchants', { q: debouncedSearch, status, page, perPage }],
    [debouncedSearch, status, page, perPage],
  );

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      listPlatformMerchantsPaginated({
        q: debouncedSearch || undefined,
        status,
        page,
        limit: perPage,
      }),
  });

  const items = data?.items ?? [];
  const total = data?.meta.total ?? 0;

  return (
    <div data-testid={testIds.platform.merchantsPage}>
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-bold text-[var(--platform-text)]">Merchants</h1>
        <p className={cn('text-sm', platformMutedClass())}>
          Contas merchant da plataforma (uma conta pode ter várias lojas).
        </p>
      </div>

      <div className="mb-6" data-testid={testIds.platform.merchantsToolbar}>
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
                placeholder="Buscar merchant, slug…"
                className="pl-9"
                data-testid={testIds.platform.merchantsSearch}
              />
            </div>
            <FieldSelect
              surface="platform"
              value={status ?? ''}
              emptyLabel="Todos"
              triggerClassName="sm:max-w-[10rem]"
              onValueChange={(v) =>
                updateParams({
                  status: v || null,
                  page: null,
                })
              }
              data-testid={testIds.platform.merchantsFilterStatus}
            >
              <FieldSelectItem value="active">Ativos</FieldSelectItem>
              <FieldSelectItem value="suspended">Suspensos</FieldSelectItem>
            </FieldSelect>
          </PageToolbarStart>
        </PageToolbar>
      </div>

      {isLoading ? (
        <div className={cn('py-12 text-center text-sm', platformMutedClass())}>Carregando…</div>
      ) : items.length === 0 ? (
        <div
          data-testid={testIds.platform.merchantsEmpty}
          className={cn(
            'rounded-xl border border-dashed border-[var(--platform-border)] py-16 text-center',
            platformMutedClass(),
          )}
        >
          Nenhum merchant encontrado.
        </div>
      ) : (
        <div data-testid={testIds.platform.merchantsList}>
          <Table surface="platform">
            <TableHead surface="platform">
              <TableRow surface="platform">
                <TableHeaderCell>Nome</TableHeaderCell>
                <TableHeaderCell>Slug</TableHeaderCell>
                <TableHeaderCell>Plano</TableHeaderCell>
                <TableHeaderCell>Lojas</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Criado em</TableHeaderCell>
              </TableRow>
            </TableHead>
            <tbody>
              {items.map((merchant: PlatformMerchantListItem) => (
                <TableRow
                  key={merchant.slug}
                  surface="platform"
                  data-testid={testIds.platform.merchantsRow(merchant.slug)}
                >
                  <TableCell className="font-medium">{merchant.name}</TableCell>
                  <TableCell className={platformMutedClass()}>{merchant.slug}</TableCell>
                  <TableCell className="capitalize">{merchant.plano ?? '—'}</TableCell>
                  <TableCell>{merchant.storesCount}</TableCell>
                  <TableCell>
                    {merchant.ativo ? (
                      <span className="ds-badge ds-badge-success">Ativo</span>
                    ) : (
                      <span className="ds-badge-suspended">Suspenso</span>
                    )}
                  </TableCell>
                  <TableCell className={platformMutedClass()}>
                    {merchant.createdAt
                      ? new Date(merchant.createdAt).toLocaleDateString('pt-BR')
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
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
