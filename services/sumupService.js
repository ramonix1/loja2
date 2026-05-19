const https = require('https');

const BASE_URL = 'https://api.sumup.com';

function apiRequest(method, path, body, apiKey) {
  const key = apiKey || process.env.SUMUP_API_KEY;
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'api.sumup.com',
      path,
      method,
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    };
    const req = https.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(d);
          if (res.statusCode >= 400) {
            const err = new Error(json.message || `SumUp error ${res.statusCode}`);
            err.statusCode = res.statusCode;
            err.body = json;
            reject(err);
          } else {
            resolve(json);
          }
        } catch {
          resolve(d);
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ── Online Checkout ───────────────────────────────────────────────────────────

/**
 * Cria um checkout online (hosted page ou widget)
 * Retorna { id, checkout_reference, hosted_checkout_url }
 */
async function criarCheckoutOnline({ pedidoId, valor, descricao, email, redirectUrl }) {
  return apiRequest('POST', '/v0.1/checkouts', {
    checkout_reference: `PEDIDO-${pedidoId}-${Date.now()}`,
    amount: parseFloat(valor),
    currency: 'BRL',
    pay_to_email: process.env.SUMUP_MERCHANT_EMAIL || undefined,
    merchant_code: process.env.SUMUP_MERCHANT_CODE || undefined,
    description: descricao || `Pedido #${pedidoId}`,
    redirect_url: redirectUrl || `${process.env.APP_URL}/checkout/resultado/${pedidoId}`,
    customer_id: email,
    return_url: redirectUrl || `${process.env.APP_URL}/checkout/resultado/${pedidoId}`,
  });
}

/**
 * Consulta status de um checkout pelo ID
 */
async function consultarCheckout(checkoutId) {
  return apiRequest('GET', `/v0.1/checkouts/${checkoutId}`);
}

// ── Cloud API (Maquininha Remota) ─────────────────────────────────────────────

/**
 * Lista as leitoras (readers) vinculadas à conta
 */
async function listarLeitoras() {
  return apiRequest('GET', '/v0.1/readers');
}

/**
 * Cria uma transação remota na maquininha física
 * O leitor deve estar ligado, com boa sinal e vinculado
 * Retorna o objeto de transação com { client_transaction_id, status, ... }
 */
async function criarTransacaoMaquininha({ pedidoId, valor, descricao, readerId }) {
  const id = readerId || process.env.SUMUP_READER_ID;
  if (!id) throw new Error('SUMUP_READER_ID não configurado.');

  return apiRequest('POST', `/v0.1/readers/${id}/checkout`, {
    total_amount: {
      minor_unit: Math.round(parseFloat(valor) * 100), // centavos
      currency: 'BRL'
    },
    client_transaction_id: `pedido-${pedidoId}-${Date.now()}`,
    description: descricao || `Pedido #${pedidoId}`,
  });
}

/**
 * Consulta o status de uma transação na maquininha
 */
async function consultarTransacaoMaquininha(readerId, clientTransactionId) {
  const id = readerId || process.env.SUMUP_READER_ID;
  return apiRequest('GET', `/v0.1/readers/${id}/checkout/${clientTransactionId}`);
}

/**
 * Cancela uma transação pendente na maquininha
 */
async function cancelarTransacaoMaquininha(readerId, clientTransactionId) {
  const id = readerId || process.env.SUMUP_READER_ID;
  return apiRequest('DELETE', `/v0.1/readers/${id}/checkout/${clientTransactionId}`);
}

/**
 * Mapeia status SumUp → status interno
 */
function mapearStatus(status) {
  const mapa = {
    PAID: 'pago',
    SUCCESSFUL: 'pago',
    PENDING: 'pendente',
    PROCESSING: 'em_analise',
    FAILED: 'rejeitado',
    CANCELLED: 'cancelado',
    REFUNDED: 'estornado',
    // Cloud API statuses
    in_progress: 'pendente',
    successful: 'pago',
    failed: 'rejeitado',
    timed_out: 'cancelado',
    cancelled: 'cancelado',
  };
  return mapa[status] || 'pendente';
}

module.exports = {
  criarCheckoutOnline,
  consultarCheckout,
  listarLeitoras,
  criarTransacaoMaquininha,
  consultarTransacaoMaquininha,
  cancelarTransacaoMaquininha,
  mapearStatus,
};
