import type { PedidoStatus } from '@lojao/types/pedidos';
import { PEDIDO_STATUS } from '@lojao/types/pedidos';
import {
  Button,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  adminEmptyStateClass,
  adminInputClass,
  adminMutedClass,
  adminPageTitleClass,
  adminSubtleClass,
  cn,
  StatusBadge,
} from '@lojao/ui';
import { testIds } from '@lojao/test-utils';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { apiFetch } from '../../lib/api-client';

interface Pedido {
  id: number;
  created_at: string;
  status: string;
  total: number;
  metodo_pagamento: string | null;
  total_itens: number;
  cliente_nome: string | null;
  cliente_email: string | null;
}

interface PedidosResponse {
  data: Pedido[];
  meta: { page: number; perPage: number; total: number; status?: string };
}

const PER_PAGE = 20;
const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const STATUS_LABEL: Record<PedidoStatus, string> = {
  aguardando_pagamento: 'Aguardando pagamento',
  pago: 'Pago',
  em_separacao: 'Em separação',
  enviado: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

function PedidoStatusBadge({ status }: { status: string }) {
  return (
    <StatusBadge status={status}>
      {STATUS_LABEL[status as PedidoStatus] ?? status.replace(/_/g, ' ')}
    </StatusBadge>
  );
}

function metodoLabel(metodo: string | null): string {
  if (!metodo) return '—';
  if (metodo === 'pix') return 'PIX';
  if (metodo === 'boleto') return 'Boleto';
  return 'Cartão';
}

function fetchPedidos(page: number, status: string) {
  const params = new URLSearchParams({ page: String(page), perPage: String(PER_PAGE) });
  if (status) params.set('status', status);
  return apiFetch<PedidosResponse>(`/api/v1/admin/pedidos?${params}`);
}

export function PedidosPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'pedidos', page, statusFilter],
    queryFn: () => fetchPedidos(page, statusFilter),
  });

  const pedidos = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  function handleFilterChange(value: string) {
    setStatusFilter(value);
    setPage(1);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className={adminPageTitleClass()}>Pedidos</h1>
        <select
          data-testid={testIds.admin.pedidosFilterStatus}
          value={statusFilter}
          onChange={(e) => handleFilterChange(e.target.value)}
          className={adminInputClass('w-auto')}
        >
          <option value="">Todos os status</option>
          {PEDIDO_STATUS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      {isError && (
        <p className="ds-alert-error mb-4 text-sm">
          Não foi possível carregar os pedidos.
        </p>
      )}

      {isLoading ? (
        <div
          data-testid={testIds.admin.pedidosLoading}
          className={adminEmptyStateClass('p-8')}
        >
          Carregando pedidos…
        </div>
      ) : (
        <Table surface="admin" data-testid={testIds.admin.pedidosTable}>
          <TableHead surface="admin">
            <TableRow surface="admin">
              <TableHeaderCell>#</TableHeaderCell>
              <TableHeaderCell>Data</TableHeaderCell>
              <TableHeaderCell>Cliente</TableHeaderCell>
              <TableHeaderCell>Itens</TableHeaderCell>
              <TableHeaderCell>Método</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell className="text-right">Total</TableHeaderCell>
              <TableHeaderCell className="text-right">Ações</TableHeaderCell>
            </TableRow>
          </TableHead>
          <tbody>
            {pedidos.length === 0 ? (
              <TableRow surface="admin">
                <TableCell colSpan={8} className="py-10 text-center">
                  <span data-testid={testIds.admin.pedidosEmpty} className={adminMutedClass()}>
                    Nenhum pedido encontrado.
                  </span>
                </TableCell>
              </TableRow>
            ) : (
              pedidos.map((pedido) => (
                <TableRow
                  key={pedido.id}
                  surface="admin"
                  data-testid={testIds.admin.pedidosRow(pedido.id)}
                >
                  <TableCell className="font-mono">
                    <span className={adminMutedClass()}>#{pedido.id}</span>
                  </TableCell>
                  <TableCell>
                    {new Date(pedido.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="text-[var(--admin-text)]">{pedido.cliente_nome ?? '—'}</div>
                    <div className={cn('text-xs', adminSubtleClass())}>{pedido.cliente_email ?? ''}</div>
                  </TableCell>
                  <TableCell>{pedido.total_itens}</TableCell>
                  <TableCell className="capitalize">
                    {metodoLabel(pedido.metodo_pagamento)}
                  </TableCell>
                  <TableCell>
                    <PedidoStatusBadge status={pedido.status} />
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {BRL.format(pedido.total)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      to={`/admin/pedidos/${pedido.id}`}
                      data-testid={testIds.admin.pedidosViewBtn(pedido.id)}
                      className="ds-link text-sm font-medium"
                    >
                      Ver
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </tbody>
        </Table>
      )}

      <div className={cn('mt-4 flex items-center justify-between text-sm', adminMutedClass())}>
        <span>
          {total} pedido{total === 1 ? '' : 's'} · página {page} de {totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <Button
            variant="secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
}
