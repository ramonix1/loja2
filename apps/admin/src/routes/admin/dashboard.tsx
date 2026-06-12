import type { PedidoRecente } from '@lojao/types/pedidos';
import { Card, Table, cn } from '@lojao/ui';
import { testIds } from '@lojao/test-utils';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { apiFetch } from '../../lib/api-client';
import { DashboardCharts } from './dashboard/dashboard-charts';

interface DashboardStats {
  pedidos_hoje: number;
  pedidos_pendentes: number;
  receita_mes: number;
  produtos_ativos: number;
  total_categorias: number;
  total_banners: number;
  total_pedidos: number;
  receita_total: number;
  pedidos_recentes: PedidoRecente[];
}

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const STATUS_STYLES: Record<string, string> = {
  pago: 'bg-green-900/50 text-green-400',
  aguardando_pagamento: 'bg-yellow-900/50 text-yellow-400',
  em_separacao: 'bg-blue-900/50 text-blue-400',
  enviado: 'bg-indigo-900/50 text-indigo-400',
  entregue: 'bg-emerald-900/50 text-emerald-400',
  cancelado: 'bg-red-900/50 text-red-400',
};

function fetchStats() {
  return apiFetch<{ data: DashboardStats }>('/api/v1/admin/dashboard/stats').then((r) => r.data);
}

function metodoLabel(metodo: string | null): string {
  if (!metodo) return '—';
  if (metodo === 'pix') return 'PIX';
  if (metodo === 'boleto') return 'Boleto';
  return 'Cartão';
}

export function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: fetchStats,
  });

  const recentes = data?.pedidos_recentes ?? [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-400">Bem-vindo ao painel de controle</p>
      </div>

      {isError && (
        <p className="mb-4 rounded-lg border border-red-900 bg-red-950 px-4 py-3 text-sm text-red-300">
          Não foi possível carregar as estatísticas.
        </p>
      )}

      <div
        data-testid={testIds.admin.dashboardStats}
        className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <Card title="Produtos">
          <span className="text-3xl font-bold text-white">
            {isLoading ? '—' : (data?.produtos_ativos ?? 0)}
          </span>
        </Card>
        <Card title="Categorias">
          <span className="text-3xl font-bold text-white">
            {isLoading ? '—' : (data?.total_categorias ?? 0)}
          </span>
        </Card>
        <Card title="Pedidos">
          <span className="text-3xl font-bold text-white">
            {isLoading ? '—' : (data?.total_pedidos ?? 0)}
          </span>
        </Card>
        <Card title="Banners ativos">
          <span className="text-3xl font-bold text-white">
            {isLoading ? '—' : (data?.total_banners ?? 0)}
          </span>
        </Card>
        <Card title="Receita (pagos)">
          <span className="text-3xl font-bold text-green-400">
            {isLoading ? '—' : BRL.format(data?.receita_total ?? 0)}
          </span>
        </Card>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Pedidos hoje">
          <span className="text-2xl font-bold text-white">
            {isLoading ? '—' : (data?.pedidos_hoje ?? 0)}
          </span>
        </Card>
        <Card title="Pedidos pendentes">
          <span className="text-2xl font-bold text-white">
            {isLoading ? '—' : (data?.pedidos_pendentes ?? 0)}
          </span>
        </Card>
        <Card title="Receita do mês">
          <span className="text-2xl font-bold text-white">
            {isLoading ? '—' : BRL.format(data?.receita_mes ?? 0)}
          </span>
        </Card>
        <Card title="Produtos cadastrados">
          <span className="text-2xl font-bold text-white">
            {isLoading ? '—' : (data?.produtos_ativos ?? 0)}
          </span>
        </Card>
      </div>

      <DashboardCharts />

      {recentes.length > 0 && (
        <div data-testid={testIds.admin.dashboardRecentOrders}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Pedidos recentes</h2>
            <Link to="/admin/pedidos" className="text-sm text-blue-400 hover:text-blue-300">
              Ver todos
            </Link>
          </div>
          <Table>
            <thead>
              <tr className="border-b border-gray-800 text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Método</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Data</th>
              </tr>
            </thead>
            <tbody>
              {recentes.map((p) => (
                <tr
                  key={p.id}
                  data-testid={testIds.admin.dashboardRecentRow(p.id)}
                  className="border-b border-gray-800 last:border-0 hover:bg-gray-900/60"
                >
                  <td className="px-4 py-3 font-mono text-gray-400">
                    <Link to={`/admin/pedidos/${p.id}`} className="hover:text-blue-400">
                      #{p.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-100">
                    <Link to={`/admin/pedidos/${p.id}`} className="hover:text-blue-300">
                      {p.cliente_nome}
                    </Link>
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-300">
                    {metodoLabel(p.metodo_pagamento)}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-100">{BRL.format(p.total)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                        STATUS_STYLES[p.status] ?? 'bg-gray-800 text-gray-300',
                      )}
                    >
                      {p.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(p.created_at).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
}
