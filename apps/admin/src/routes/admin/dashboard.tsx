import type { PedidoRecente } from '@lojao/types/pedidos';
import {
  KpiCell,
  KpiStrip,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  adminMutedClass,
  adminPageSubtitleClass,
  adminPageTitleClass,
  adminSectionTitleClass,
  StatusBadge,
} from '@lojao/ui';
import { testIds } from '@lojao/test-utils';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ActionIcons } from '@lojao/ui/icons';

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

      {isLoading || !data ? (
        <KpiStrip
          surface="admin"
          testId={testIds.admin.dashboardStats}
          primary={
            <>
              {[1, 2, 3, 4].map((i) => (
                <KpiCell key={i} label="…" value="—" />
              ))}
            </>
          }
          secondary={
            <>
              {[1, 2, 3, 4].map((i) => (
                <KpiCell key={`s-${i}`} label="…" value="—" />
              ))}
            </>
          }
        />
      ) : (
        <KpiStrip
          surface="admin"
          testId={testIds.admin.dashboardStats}
          className="mb-8"
          primary={
            <>
              <KpiCell label="Pedidos hoje" value={data.pedidos_hoje} />
              <KpiCell label="Pedidos pendentes" value={data.pedidos_pendentes} />
              <KpiCell label="Total de pedidos" value={data.total_pedidos} />
              <KpiCell label="Banners ativos" value={data.total_banners} />
            </>
          }
          secondary={
            <>
              <KpiCell label="Receita do mês" value={BRL.format(data.receita_mes)} />
              <KpiCell label="Receita (pagos)" value={BRL.format(data.receita_total)} />
              <KpiCell label="Produtos ativos" value={data.produtos_ativos} />
              <KpiCell label="Categorias" value={data.total_categorias} />
            </>
          }
        />
      )}

      <DashboardCharts />

      {recentes.length > 0 && (
        <div data-testid={testIds.admin.dashboardRecentOrders}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className={adminSectionTitleClass()}>Pedidos recentes</h2>
            <Link
              to="/admin/pedidos"
              className="inline-flex items-center gap-1 text-sm text-[var(--admin-link)] hover:underline"
            >
              Ver todos
              <ActionIcons.next className="size-4" aria-hidden />
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
