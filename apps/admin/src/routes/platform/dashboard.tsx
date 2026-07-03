import { KpiCell, KpiStrip, platformMutedClass, cn } from '@lojao/ui';
import { testIds } from '@lojao/test-utils';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { getPlatformDashboardStats } from '../../lib/platform-api';
import { PlatformDashboardCharts } from './dashboard/dashboard-charts';

export function PlatformDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['platform', 'dashboard', 'stats'],
    queryFn: getPlatformDashboardStats,
  });

  return (
    <div data-testid={testIds.platform.dashboardPage}>
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-bold text-[var(--platform-text)]">Dashboard</h1>
        <p className={cn('text-sm', platformMutedClass())}>
          Visão consolidada da plataforma Ata Labs.
        </p>
      </div>

      {isLoading || !stats ? (
        <KpiStrip
          surface="platform"
          primary={
            <>
              {[1, 2, 3, 4].map((i) => (
                <KpiCell key={i} label="…" value="—" />
              ))}
            </>
          }
        />
      ) : (
        <KpiStrip
          surface="platform"
          testId={testIds.platform.kpiStrip}
          primary={
            <>
              <KpiCell label="Total de lojas" value={stats.totalStores} />
              <KpiCell label="Lojas ativas" value={stats.activeStores} />
              <KpiCell label="Suspensas" value={stats.suspendedStores} />
              <KpiCell label="Novas (30 dias)" value={stats.newStores30d} />
            </>
          }
          secondary={
            <>
              <KpiCell label="Merchants" value={stats.totalMerchants} />
              <KpiCell label="Trials (7d)" value={stats.trialsExpiring7d} />
              <KpiCell label="GMV (30d)" value="—" />
              <KpiCell label="Pedidos (30d)" value="—" />
              <KpiCell label="Top loja" value="—" />
            </>
          }
        />
      )}

      <PlatformDashboardCharts />

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link
          to="/platform/stores/novo"
          className="rounded-xl border border-[var(--platform-border)] bg-[var(--platform-surface)] p-5 transition hover:border-[var(--platform-accent)]"
        >
          <div className="font-semibold text-[var(--platform-text)]">Nova loja</div>
          <p className={cn('mt-1 text-sm', platformMutedClass())}>Provisionar merchant + vitrine</p>
        </Link>
        <Link
          to="/platform/stores?status=suspended"
          className="rounded-xl border border-[var(--platform-border)] bg-[var(--platform-surface)] p-5 transition hover:border-[var(--platform-accent)]"
        >
          <div className="font-semibold text-[var(--platform-text)]">Ver suspensas</div>
          <p className={cn('mt-1 text-sm', platformMutedClass())}>Lojas ou merchants inativos</p>
        </Link>
        <a
          href="https://docs.atacommerce.com.br"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-[var(--platform-border)] bg-[var(--platform-surface)] p-5 transition hover:border-[var(--platform-accent)]"
        >
          <div className="font-semibold text-[var(--platform-text)]">Documentação</div>
          <p className={cn('mt-1 text-sm', platformMutedClass())}>Guias de suporte e operação</p>
        </a>
      </div>
    </div>
  );
}

export function PlatformSettingsPlaceholderPage() {
  return (
    <div data-testid={testIds.platform.settingsPage}>
      <h1 className="mb-1 text-2xl font-bold text-[var(--platform-text)]">Configurações</h1>
      <p className={cn('text-sm', platformMutedClass())}>
        Preferências do Platform Ops — credenciais master via variáveis de ambiente (`MASTER_EMAIL`,
        `MASTER_PASSWORD`). Billing Asaas completo permanece em spec separada.
      </p>
    </div>
  );
}
