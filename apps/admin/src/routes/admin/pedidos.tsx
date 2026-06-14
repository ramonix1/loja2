import type { PedidoStatus } from '@lojao/types/pedidos';
import { PEDIDO_STATUS } from '@lojao/types/pedidos';
import { Button, Table, cn } from '@lojao/ui';
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

const STATUS_STYLES: Record<string, string> = {
  pago: 'bg-green-900 text-green-300',
  aguardando_pagamento: 'bg-yellow-900 text-yellow-300',
  em_separacao: 'bg-blue-900 text-blue-300',
  enviado: 'bg-indigo-900 text-indigo-300',
  entregue: 'bg-emerald-900 text-emerald-300',
  cancelado: 'bg-red-900 text-red-300',
};

const STATUS_LABEL: Record<PedidoStatus, string> = {
  aguardando_pagamento: 'Aguardando pagamento',
  pago: 'Pago',
  em_separacao: 'Em separação',
  enviado: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
        STATUS_STYLES[status] ?? 'bg-gray-800 text-gray-300',
      )}
    >
      {STATUS_LABEL[status as PedidoStatus] ?? status.replace(/_/g, ' ')}
    </span>
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
        <h1 className="text-2xl font-bold text-white">Pedidos</h1>
        <select
          data-testid={testIds.admin.pedidosFilterStatus}
          value={statusFilter}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
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
        <p className="mb-4 rounded-lg border border-red-900 bg-red-950 px-4 py-3 text-sm text-red-300">
          Não foi possível carregar os pedidos.
        </p>
      )}

      {isLoading ? (
        <div
          data-testid={testIds.admin.pedidosLoading}
          className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center text-gray-400"
        >
          Carregando pedidos…
        </div>
      ) : (
        <Table data-testid={testIds.admin.pedidosTable}>
          <thead>
            <tr className="border-b border-gray-800 text-xs uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Itens</th>
              <th className="px-4 py-3">Método</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                  <span data-testid={testIds.admin.pedidosEmpty}>
                    Nenhum pedido encontrado.
                  </span>
                </td>
              </tr>
            ) : (
              pedidos.map((pedido) => (
                <tr
                  key={pedido.id}
                  data-testid={testIds.admin.pedidosRow(pedido.id)}
                  className="border-b border-gray-800 last:border-0 hover:bg-gray-900/60"
                >
                  <td className="px-4 py-3 font-mono text-gray-400">#{pedido.id}</td>
                  <td className="px-4 py-3 text-gray-300">
                    {new Date(pedido.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-100">{pedido.cliente_nome ?? '—'}</div>
                    <div className="text-xs text-gray-500">{pedido.cliente_email ?? ''}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{pedido.total_itens}</td>
                  <td className="px-4 py-3 capitalize text-gray-300">
                    {metodoLabel(pedido.metodo_pagamento)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={pedido.status} />
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-100">
                    {BRL.format(pedido.total)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/admin/pedidos/${pedido.id}`}
                      data-testid={testIds.admin.pedidosViewBtn(pedido.id)}
                      className="text-sm font-medium text-blue-400 hover:text-blue-300"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      )}

      <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
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
