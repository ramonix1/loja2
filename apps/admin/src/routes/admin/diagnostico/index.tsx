import { Button, Card, cn } from '@lojao/ui';
import { testIds } from '@lojao/test-utils';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { apiFetch } from '../../../lib/api-client';

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
    return <p className="text-gray-400">Executando diagnóstico…</p>;
  }

  return (
    <div data-testid={testIds.adminDiagnostico.panel}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Diagnóstico de Pagamentos</h1>
        <p className="mt-1 text-sm text-gray-400">
          Verifique se as credenciais e conexões estão configuradas corretamente.
        </p>
      </div>

      <div className="max-w-2xl space-y-3" data-testid={testIds.adminDiagnostico.results}>
        {resultados.map((r) => (
          <Card
            key={r.nome}
            data-testid={testIds.adminDiagnostico.item(r.nome)}
            className={cn(
              'flex items-start gap-4 px-5 py-4',
              r.ok ? 'border-green-800' : 'border-red-800',
            )}
          >
            <span className={cn('mt-0.5 text-lg', r.ok ? 'text-green-400' : 'text-red-400')}>
              {r.ok ? '✓' : '✗'}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-white">{r.nome}</div>
              <div className="mt-1 truncate font-mono text-xs text-gray-400">{r.valor}</div>
              {r.dica && (
                <div className="mt-1.5 rounded bg-red-950/50 px-2 py-1 text-xs text-red-400">
                  {r.dica}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-8 max-w-2xl" data-testid={testIds.adminDiagnostico.helpSection}>
        <h2 className="mb-3 font-bold text-white">Como obter as credenciais</h2>
        <div className="space-y-4 text-sm text-gray-400">
          <div>
            <p className="mb-1 font-semibold text-white">Mercado Pago (credenciais de teste)</p>
            <ol className="list-inside list-decimal space-y-1">
              <li>
                Acesse <span className="font-mono text-blue-400">mercadopago.com.br</span> e entre na
                conta
              </li>
              <li>
                Vá em <strong className="text-gray-200">Seu negócio → Configurações → Credenciais</strong>
              </li>
              <li>
                Selecione aba <strong className="text-gray-200">Credenciais de teste</strong>
              </li>
              <li>
                Copie o <strong className="text-gray-200">Access Token</strong> (TEST-) e a{' '}
                <strong className="text-gray-200">Public Key</strong>
              </li>
            </ol>
            <pre className="mt-2 overflow-x-auto rounded bg-gray-800 px-3 py-2 text-xs text-green-300">
              {`MP_ACCESS_TOKEN=TEST-xxxxxxxxxxxx\nMP_PUBLIC_KEY=TEST-xxxxxxxxxxxx`}
            </pre>
          </div>
          <div>
            <p className="mb-1 font-semibold text-white">SumUp</p>
            <ol className="list-inside list-decimal space-y-1">
              <li>
                Acesse <span className="font-mono text-blue-400">developer.sumup.com</span>
              </li>
              <li>
                Copie a <strong className="text-gray-200">API Key</strong> e o{' '}
                <strong className="text-gray-200">Merchant Code</strong>
              </li>
            </ol>
            <pre className="mt-2 overflow-x-auto rounded bg-gray-800 px-3 py-2 text-xs text-green-300">
              {`SUMUP_API_KEY=sup_sk_xxxxxxxxxxxx\nSUMUP_MERCHANT_CODE=MXXXXXXXX`}
            </pre>
          </div>
          <div>
            <p className="font-semibold text-white">Após editar o .env</p>
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
          className="text-sm text-gray-400 transition hover:text-white"
          data-testid={testIds.adminDiagnostico.configLink}
        >
          ← Configurações
        </Link>
      </div>
    </div>
  );
}
