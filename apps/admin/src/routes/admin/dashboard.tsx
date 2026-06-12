import { Card } from '@lojao/ui';
import { testIds } from '@lojao/test-utils';
import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '../../lib/api-client';

interface DashboardStats {
  pedidos_hoje: number;
  pedidos_pendentes: number;
  receita_mes: number;
  produtos_ativos: number;
}

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function fetchStats() {
  return apiFetch<{ data: DashboardStats }>('/api/v1/admin/dashboard/stats').then((r) => r.data);
}

export function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: fetchStats,
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">Dashboard</h1>

      {isError && (
        <p className="rounded-lg border border-red-900 bg-red-950 px-4 py-3 text-sm text-red-300">
          Não foi possível carregar as estatísticas.
        </p>
      )}

      <div
        data-testid={testIds.admin.dashboardStats}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Card title="Pedidos hoje">
          <span className="text-3xl font-bold text-white">
            {isLoading ? '—' : (data?.pedidos_hoje ?? 0)}
          </span>
        </Card>
        <Card title="Pedidos pendentes">
          <span className="text-3xl font-bold text-white">
            {isLoading ? '—' : (data?.pedidos_pendentes ?? 0)}
          </span>
        </Card>
        <Card title="Receita do mês">
          <span className="text-3xl font-bold text-white">
            {isLoading ? '—' : BRL.format(data?.receita_mes ?? 0)}
          </span>
        </Card>
        <Card title="Produtos ativos">
          <span className="text-3xl font-bold text-white">
            {isLoading ? '—' : (data?.produtos_ativos ?? 0)}
          </span>
        </Card>
      </div>
    </div>
  );
}
