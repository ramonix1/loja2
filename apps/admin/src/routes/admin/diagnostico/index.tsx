import {
  Button,
  Card,
  adminMutedClass,
  adminPageSubtitleClass,
  adminPageTitleClass,
  adminSectionTitleClass,
  cn,
} from '@lojao/ui';
import { testIds } from '@lojao/test-utils';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { apiFetch } from '../../../lib/api-client';
import { DesignTokenSwatch } from './design-token-swatch';

interface DiagnosticoItem {
  nome: string;
  ok: boolean;
  valor: string;
  dica: string | null;
}

function fetchDiagnostico() {
  return apiFetch<{ data: { resultados: DiagnosticoItem[] } }>('/api/v1/admin/diagnostico').then(
    (r) => r.data.resultados,
  );
}

export function DiagnosticoPage() {
  const { data: resultados = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'diagnostico'],
    queryFn: fetchDiagnostico,
  });

  if (isLoading) {
    return <p className={adminMutedClass()}>Executando diagnóstico…</p>;
  }

  return (
    <div data-testid={testIds.adminDiagnostico.panel}>
      <DesignTokenSwatch />

      <div className="mb-6">
        <h1 className={adminPageTitleClass()}>Diagnóstico de Pagamentos</h1>
        <p className={adminPageSubtitleClass('mt-1')}>
          Verifique se as credenciais e conexões estão configuradas corretamente.
        </p>
      </div>

      <div className="max-w-2xl space-y-3" data-testid={testIds.adminDiagnostico.results}>
        {resultados.map((r) => (
          <Card
            key={r.nome}
            surface="admin"
            data-testid={testIds.adminDiagnostico.item(r.nome)}
            className={cn(
              'flex items-start gap-4 px-5 py-4',
              r.ok ? 'border-[var(--admin-success)]' : 'border-[var(--admin-error)]',
            )}
          >
            <span className={cn('mt-0.5 text-lg', r.ok ? 'text-[var(--admin-success)]' : 'text-[var(--admin-error-text)]')}>
              {r.ok ? '✓' : '✗'}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-[var(--admin-text)]">{r.nome}</div>
              <div className={cn('mt-1 truncate font-mono text-xs', adminMutedClass())}>{r.valor}</div>
              {r.dica && (
                <div className="mt-1.5 rounded bg-[var(--admin-error-bg)] px-2 py-1 text-xs text-[var(--admin-error-text)]">
                  {r.dica}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Card surface="admin" className="mt-8 max-w-2xl" data-testid={testIds.adminDiagnostico.helpSection}>
        <h2 className={adminSectionTitleClass('mb-3')}>Como obter as credenciais</h2>
        <div className={cn('space-y-4 text-sm', adminMutedClass())}>
          <div>
            <p className="mb-1 font-semibold text-[var(--admin-text)]">Mercado Pago (credenciais de teste)</p>
            <ol className="list-inside list-decimal space-y-1">
              <li>
                Acesse <span className="ds-link font-mono">mercadopago.com.br</span> e entre na
                conta
              </li>
              <li>
                Vá em <strong className="text-[var(--admin-text)]">Seu negócio → Configurações → Credenciais</strong>
              </li>
              <li>
                Selecione aba <strong className="text-[var(--admin-text)]">Credenciais de teste</strong>
              </li>
              <li>
                Copie o <strong className="text-[var(--admin-text)]">Access Token</strong> (TEST-) e a{' '}
                <strong className="text-[var(--admin-text)]">Public Key</strong>
              </li>
            </ol>
            <pre className="mt-2 overflow-x-auto rounded bg-[var(--admin-surface-elevated)] px-3 py-2 text-xs text-[var(--admin-success-text)]">
              {`MP_ACCESS_TOKEN=TEST-xxxxxxxxxxxx\nMP_PUBLIC_KEY=TEST-xxxxxxxxxxxx`}
            </pre>
          </div>
          <div>
            <p className="mb-1 font-semibold text-[var(--admin-text)]">SumUp</p>
            <ol className="list-inside list-decimal space-y-1">
              <li>
                Acesse <span className="ds-link font-mono">developer.sumup.com</span>
              </li>
              <li>
                Copie a <strong className="text-[var(--admin-text)]">API Key</strong> e o{' '}
                <strong className="text-[var(--admin-text)]">Merchant Code</strong>
              </li>
            </ol>
            <pre className="mt-2 overflow-x-auto rounded bg-[var(--admin-surface-elevated)] px-3 py-2 text-xs text-[var(--admin-success-text)]">
              {`SUMUP_API_KEY=sup_sk_xxxxxxxxxxxx\nSUMUP_MERCHANT_CODE=MXXXXXXXX`}
            </pre>
          </div>
          <div>
            <p className="font-semibold text-[var(--admin-text)]">Após editar o .env</p>
            <p className="mt-1">
              Reinicie os serviços e clique em &quot;Atualizar diagnóstico&quot; abaixo.
            </p>
          </div>
        </div>
      </Card>

      <div className="mt-4 flex items-center gap-4">
        <Button
          type="button"
          variant="secondary"
          data-testid={testIds.adminDiagnostico.refreshBtn}
          disabled={isFetching}
          onClick={() => refetch()}
        >
          Atualizar diagnóstico
        </Button>
        <Link
          to="/admin/configuracoes"
          className={cn('ds-link text-sm', adminMutedClass())}
          data-testid={testIds.adminDiagnostico.configLink}
        >
          ← Configurações
        </Link>
      </div>
    </div>
  );
}
