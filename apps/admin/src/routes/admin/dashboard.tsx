import type { PedidoRecente } from '@lojao/types/pedidos';
import {
  Card,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  adminMutedClass,
  adminPageSubtitleClass,
  adminPageTitleClass,
  adminSectionTitleClass,
  adminStatValueClass,
  adminStatValueSuccessClass,
  StatusBadge,
  cn,
} from '@lojao/ui';
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
        <h1 className={adminPageTitleClass()}>Dashboard</h1>
        <p className={adminPageSubtitleClass('mt-1')}>Bem-vindo ao painel de controle</p>
      </div>

      {isError && (
        <p className="ds-alert-error mb-4">Não foi possível carregar as estatísticas.</p>
      )}

      <div
        data-testid={testIds.admin.dashboardStats}
        className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <Card surface="admin" title="Produtos">
          <span className={adminStatValueClass()}>{isLoading ? '—' : (data?.produtos_ativos ?? 0)}</span>
        </Card>
        <Card surface="admin" title="Categorias">
          <span className={adminStatValueClass()}>{isLoading ? '—' : (data?.total_categorias ?? 0)}</span>
        </Card>
        <Card surface="admin" title="Pedidos">
          <span className={adminStatValueClass()}>{isLoading ? '—' : (data?.total_pedidos ?? 0)}</span>
        </Card>
        <Card surface="admin" title="Banners ativos">
          <span className={adminStatValueClass()}>{isLoading ? '—' : (data?.total_banners ?? 0)}</span>
        </Card>
        <Card surface="admin" title="Receita (pagos)">
          <span className={adminStatValueSuccessClass()}>
            {isLoading ? '—' : BRL.format(data?.receita_total ?? 0)}
          </span>
        </Card>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card surface="admin" title="Pedidos hoje">
          <span className={cn(adminStatValueClass(), 'text-2xl')}>
            {isLoading ? '—' : (data?.pedidos_hoje ?? 0)}
          </span>
        </Card>
        <Card surface="admin" title="Pedidos pendentes">
          <span className={cn(adminStatValueClass(), 'text-2xl')}>
            {isLoading ? '—' : (data?.pedidos_pendentes ?? 0)}
          </span>
        </Card>
        <Card surface="admin" title="Receita do mês">
          <span className={cn(adminStatValueClass(), 'text-2xl')}>
            {isLoading ? '—' : BRL.format(data?.receita_mes ?? 0)}
          </span>
        </Card>
        <Card surface="admin" title="Produtos cadastrados">
          <span className={cn(adminStatValueClass(), 'text-2xl')}>
            {isLoading ? '—' : (data?.produtos_ativos ?? 0)}
          </span>
        </Card>
      </div>

      <DashboardCharts />

      {recentes.length > 0 && (
        <div data-testid={testIds.admin.dashboardRecentOrders}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className={adminSectionTitleClass()}>Pedidos recentes</h2>
            <Link to="/admin/pedidos" className="ds-link text-sm">
              Ver todos
            </Link>
          </div>
          <Table surface="admin">
            <TableHead surface="admin">
              <TableRow surface="admin">
                <TableHeaderCell>#</TableHeaderCell>
                <TableHeaderCell>Cliente</TableHeaderCell>
                <TableHeaderCell>Método</TableHeaderCell>
                <TableHeaderCell>Total</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Data</TableHeaderCell>
              </TableRow>
            </TableHead>
            <tbody>
              {recentes.map((p) => (
                <TableRow
                  key={p.id}
                  surface="admin"
                  data-testid={testIds.admin.dashboardRecentRow(p.id)}
                >
                  <TableCell className="font-mono">
                    <Link to={`/admin/pedidos/${p.id}`} className="ds-link">
                      #{p.id}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link to={`/admin/pedidos/${p.id}`} className="ds-link">
                      {p.cliente_nome}
                    </Link>
                  </TableCell>
                  <TableCell className="capitalize">{metodoLabel(p.metodo_pagamento)}</TableCell>
                  <TableCell className="font-semibold">{BRL.format(p.total)}</TableCell>
                  <TableCell>
                    <StatusBadge status={p.status}>{p.status.replace(/_/g, ' ')}</StatusBadge>
                  </TableCell>
                  <TableCell className={adminMutedClass()}>
                    {new Date(p.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
}
