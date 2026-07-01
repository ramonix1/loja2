export async function testMercadoPagoApi(token: string): Promise<{ ok: boolean; erro: string | null }> {
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

export async function testSumUpApi(apiKey: string): Promise<{ ok: boolean; erro: string | null }> {
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
