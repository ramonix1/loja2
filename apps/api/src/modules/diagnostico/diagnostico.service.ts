import type { DiagnosticoItem } from '@lojao/types/diagnostico';

import { testMercadoPagoApi, testSumUpApi } from './diagnostico.repository.js';

function maskSecret(value: string, visible = 12): string {
  return value ? `${value.slice(0, visible)}...` : '(vazio)';
}

/** Porta `configController.diagnostico`. */
export async function runDiagnostico(): Promise<DiagnosticoItem[]> {
  const mpToken = process.env.MP_ACCESS_TOKEN ?? '';
  const mpPublicKey = process.env.MP_PUBLIC_KEY ?? '';
  const sumupKey = process.env.SUMUP_API_KEY ?? '';
  const sumupMerchant = process.env.SUMUP_MERCHANT_CODE ?? '';
  const appUrl = process.env.APP_URL ?? '';

  const resultados: DiagnosticoItem[] = [
    {
      nome: 'MP_ACCESS_TOKEN',
      ok: mpToken.length > 20,
      valor: maskSecret(mpToken),
      dica: mpToken ? null : 'Configure no .env: MP_ACCESS_TOKEN=APP-xxx ou TEST-xxx',
    },
    {
      nome: 'MP_PUBLIC_KEY',
      ok: mpPublicKey.length > 10,
      valor: maskSecret(mpPublicKey),
      dica: mpPublicKey ? null : 'Configure no .env: MP_PUBLIC_KEY=APP-xxx ou TEST-xxx',
    },
    {
      nome: 'SUMUP_API_KEY',
      ok: sumupKey.length > 10,
      valor: maskSecret(sumupKey),
      dica: sumupKey ? null : 'Configure no .env: SUMUP_API_KEY=sup_sk_xxx',
    },
    {
      nome: 'SUMUP_MERCHANT_CODE',
      ok: sumupMerchant.length > 3,
      valor: sumupMerchant || '(vazio)',
      dica: sumupMerchant ? null : 'Configure no .env: SUMUP_MERCHANT_CODE=MXXXXXXXX',
    },
    {
      nome: 'APP_URL',
      ok: appUrl.startsWith('http'),
      valor: appUrl || '(vazio)',
      dica: appUrl ? null : 'Configure no .env: APP_URL=https://sua-url.ngrok-free.app',
    },
  ];

  const mpTest = await testMercadoPagoApi(mpToken);
  resultados.push({
    nome: 'Conexão MP API',
    ok: mpTest.ok,
    valor: mpTest.ok ? 'OK — token válido, API acessível' : mpTest.erro ?? 'Não testado',
    dica: !mpTest.ok && mpToken && mpTest.erro ? `Erro: ${mpTest.erro}` : null,
  });

  const sumupTest = await testSumUpApi(sumupKey);
  resultados.push({
    nome: 'Conexão SumUp API',
    ok: sumupTest.ok,
    valor: sumupTest.ok ? 'OK — API respondeu' : sumupTest.erro ?? 'Não testado',
    dica: !sumupTest.ok && sumupKey && sumupTest.erro ? `Erro: ${sumupTest.erro}` : null,
  });

  return resultados;
}
