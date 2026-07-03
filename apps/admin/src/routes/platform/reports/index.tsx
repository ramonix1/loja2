import {
  Card,
  KpiCell,
  KpiStrip,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  platformMutedClass,
  cn,
} from '@lojao/ui';
import { testIds } from '@lojao/test-utils';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { getPlatformReportsSummary } from '../../../lib/platform-api';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

export function PlatformReportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['platform', 'reports'],
    queryFn: getPlatformReportsSummary,
  });

  return (
    <div data-testid={testIds.platform.reportsPage}>
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-bold text-[var(--platform-text)]">Relatórios</h1>
        <p className={cn('text-sm', platformMutedClass())}>
          Billing e onboarding — visão master-only da plataforma.
        </p>
      </div>

      {isLoading || !data ? (
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
        <>
          <KpiStrip
            surface="platform"
            testId={testIds.platform.reportsKpiStrip}
            primary={
              <>
                <KpiCell label="Merchants" value={data.totalMerchants} />
                <KpiCell label="Em trial" value={data.trialingMerchants} />
                <KpiCell label="Billing ativo" value={data.activeBillingMerchants} />
                <KpiCell label="Trials (7d)" value={data.trialsExpiring7d} />
              </>
            }
            secondary={
              data.revenueMonth ? (
                <>
                  <KpiCell
                    label={`Receita (${data.revenueMonth.month})`}
                    value={`R$ ${data.revenueMonth.total.toFixed(2)}`}
                  />
                  <KpiCell label="Faturas pagas" value={data.revenueMonth.paidInvoices} />
                  <KpiCell label="Pendentes" value={data.revenueMonth.pendingInvoices} />
                </>
              ) : (
                <>
                  <KpiCell label="Receita (mês)" value="—" />
                </>
              )
            }
          />

          <Card surface="platform" className="mt-8 overflow-hidden p-0">
            <div className="border-b border-[var(--platform-border)] px-4 py-3 font-semibold text-[var(--platform-text)]">
              Lojas recentes
            </div>
            <div data-testid={testIds.platform.reportsRecentStores}>
              <Table surface="platform">
                <TableHead surface="platform">
                  <TableRow surface="platform">
                    <TableHeaderCell>Nome</TableHeaderCell>
                    <TableHeaderCell>Slug</TableHeaderCell>
                    <TableHeaderCell>Criada em</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <tbody>
                  {data.recentStores.length === 0 ? (
                    <TableRow surface="platform">
                      <TableCell colSpan={3} className="text-center">
                        Nenhuma loja provisionada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.recentStores.map((store) => (
                      <TableRow key={store.slug} surface="platform">
                        <TableCell>
                          <Link to={`/platform/stores/${store.slug}`} className="ds-link font-medium">
                            {store.nome}
                          </Link>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{store.slug}</TableCell>
                        <TableCell>{formatDate(store.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
