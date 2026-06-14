import type { DiagnosticoItem } from '@lojao/types/diagnostico';

function maskSecret(value: string, visible = 12): string {
  return value ? `${value.slice(0, visible)}...` : '(vazio)';
}

async function testMercadoPagoApi(token: string): Promise<{ ok: boolean; erro: string | null }> {
  if (!token) return { ok: false, erro: null };

  try {
    const res = await fetch('https://api.mercadopago.com/v1/payments/1', {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });

    if (res.status === 404) return { ok: true, erro: null };
    if (res.status === 401 || res.status === 403) {
      return { ok: false, erro: `Token inválido (HTTP ${res.status})` };
    }
    return { ok: true, erro: null };
  } catch (err) {
    return { ok: false, erro: err instanceof Error ? err.message : String(err) };
  }
}

async function testSumUpApi(apiKey: string): Promise<{ ok: boolean; erro: string | null }> {
  if (!apiKey) return { ok: false, erro: null };

  try {
    const res = await fetch('https://api.sumup.com/v0.1/checkouts/test-diagnostico', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (res.status === 404) return { ok: true, erro: null };
    if (res.status === 401 || res.status === 403) {
      return { ok: false, erro: `Token inválido (${res.status})` };
    }
    return { ok: true, erro: null };
  } catch (err) {
    return { ok: false, erro: err instanceof Error ? err.message : String(err) };
  }
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
