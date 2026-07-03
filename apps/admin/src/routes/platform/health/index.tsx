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
import type { PlatformStoreHealth } from '@lojao/types/platform';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { getPlatformHealthSummary } from '../../../lib/platform-api';

const healthLabel: Record<PlatformStoreHealth, string> = {
  healthy: 'Saudável',
  attention: 'Atenção',
  suspended: 'Suspensa',
};

export function PlatformHealthPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['platform', 'health'],
    queryFn: getPlatformHealthSummary,
  });

  return (
    <div data-testid={testIds.platform.healthPage}>
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-bold text-[var(--platform-text)]">Saúde / Logs</h1>
        <p className={cn('text-sm', platformMutedClass())}>
          Lojas que exigem atenção operacional — billing, trial ou suspensão.
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
            testId={testIds.platform.healthKpiStrip}
            primary={
              <>
                <KpiCell label="Saudáveis" value={data.healthyStores} />
                <KpiCell label="Atenção" value={data.attentionStores} />
                <KpiCell label="Suspensas" value={data.suspendedStores} />
                <KpiCell label="Trials (7d)" value={data.trialsExpiring7d} />
              </>
            }
            secondary={
              <>
                <KpiCell label="Sem billing" value={data.merchantsWithoutBilling} />
              </>
            }
          />

          <Card surface="platform" className="mt-8 overflow-hidden p-0">
            {data.items.length === 0 ? (
              <div
                className={cn('py-16 text-center', platformMutedClass())}
                data-testid={testIds.platform.healthEmpty}
              >
                Nenhuma loja fora de saúde plena.
              </div>
            ) : (
              <div data-testid={testIds.platform.healthList}>
                <Table surface="platform">
                  <TableHead surface="platform">
                    <TableRow surface="platform">
                      <TableHeaderCell>Loja</TableHeaderCell>
                      <TableHeaderCell>Merchant</TableHeaderCell>
                      <TableHeaderCell>Status</TableHeaderCell>
                      <TableHeaderCell>Motivos</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <tbody>
                    {data.items.map((item) => (
                      <TableRow
                        key={item.slug}
                        surface="platform"
                        data-testid={testIds.platform.healthRow(item.slug)}
                      >
                        <TableCell>
                          <Link to={`/platform/stores/${item.slug}`} className="ds-link font-medium">
                            {item.nome}
                          </Link>
                          <div className={cn('font-mono text-xs', platformMutedClass())}>{item.slug}</div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{item.merchantSlug}</TableCell>
                        <TableCell>{healthLabel[item.health]}</TableCell>
                        <TableCell className="text-sm">{item.reasons.join(' · ')}</TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
