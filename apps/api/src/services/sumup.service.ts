import https from 'node:https';

function apiRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  const key = process.env.SUMUP_API_KEY;
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts: https.RequestOptions = {
      hostname: 'api.sumup.com',
      path,
      method,
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = https.request(opts, (res) => {
      let d = '';
      res.on('data', (c) => {
        d += c;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(d) as T & { message?: string; detail?: string };
          if (res.statusCode && res.statusCode >= 400) {
            const err = new Error(json.message || json.detail || `SumUp error ${res.statusCode}`);
            reject(err);
          } else {
            resolve(json);
          }
        } catch {
          resolve(d as T);
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function merchantCode(): string {
  const code = process.env.SUMUP_MERCHANT_CODE;
  if (!code) throw new Error('SUMUP_MERCHANT_CODE não configurado no .env');
  return code;
}

export interface SumupCheckoutInput {
  pedidoId: number;
  valor: number;
  descricao: string;
  email: string;
  redirectUrl: string;
}

export interface SumupCheckoutResult {
  id: string;
  checkout_reference?: string;
  hosted_checkout_url?: string;
  checkout_url?: string;
  status?: string;
}

export async function criarCheckoutOnline(
  input: SumupCheckoutInput,
): Promise<SumupCheckoutResult> {
  return apiRequest<SumupCheckoutResult>('POST', '/v0.1/checkouts', {
    checkout_reference: `LOJAO-${input.pedidoId}-${Date.now()}`,
    amount: parseFloat(String(input.valor)),
    currency: 'BRL',
    merchant_code: merchantCode(),
    description: input.descricao || `Pedido #${input.pedidoId}`,
    redirect_url: input.redirectUrl,
    return_url: `${process.env.APP_URL ?? 'http://localhost:3000'}/webhook/sumup`,
    customer_id: input.email,
  });
}

export async function consultarCheckout(checkoutId: string): Promise<SumupCheckoutResult> {
  return apiRequest<SumupCheckoutResult>('GET', `/v0.1/checkouts/${checkoutId}`);
}

export function mapearStatus(status: string): string {
  const mapa: Record<string, string> = {
    PAID: 'pago',
    SUCCESSFUL: 'pago',
    PENDING: 'pendente',
    PROCESSING: 'em_analise',
    FAILED: 'rejeitado',
    CANCELLED: 'cancelado',
    REFUNDED: 'estornado',
    successful: 'pago',
    in_progress: 'pendente',
    pending: 'pendente',
    failed: 'rejeitado',
    timed_out: 'cancelado',
    cancelled: 'cancelado',
  };
  return mapa[status] ?? 'pendente';
}
