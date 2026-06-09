const https = require('https');

function apiRequest(method, path, body) {
  const key = process.env.SUMUP_API_KEY;
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
            const err = new Error(json.message || json.detail || `SumUp error ${res.statusCode}`);
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

function merchantCode() {
  const code = process.env.SUMUP_MERCHANT_CODE;
  if (!code) throw new Error('SUMUP_MERCHANT_CODE nÃ£o configurado no .env');
  return code;
}

// €€ Online Checkout €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€

/**
 * Cria checkout hospedado € cliente Ã© redirecionado para pÃ¡gina da SumUp
 * Retorna { id, checkout_reference, hosted_checkout_url }
 */
async function criarCheckoutOnline({ pedidoId, valor, descricao, email, redirectUrl }) {
  return apiRequest('POST', '/v0.1/checkouts', {
    checkout_reference: `LOJAO-${pedidoId}-${Date.now()}`,
    amount: parseFloat(valor),
    currency: 'BRL',
    merchant_code: merchantCode(),                     // obrigatÃ³rio
    description: descricao || `Pedido #${pedidoId}`,
    redirect_url: redirectUrl,                         // redireciona o cliente apÃ³s pagar
    return_url: `${process.env.APP_URL}/webhook/sumup`, // notificaÃ§Ã£o backend
    customer_id: email,
  });
}

/**
 * Consulta status de um checkout online pelo ID
 */
async function consultarCheckout(checkoutId) {
  return apiRequest('GET', `/v0.1/checkouts/${checkoutId}`);
}

// €€ Cloud API € Maquininha Remota (comentado para uso futuro) €€€€€€€€€€€€€€€€€€
// Se vocÃª quiser ativar a maquininha no futuro, descomente o cÃ³digo abaixo
/*
async function listarLeitoras() {
  return apiRequest('GET', `/v0.1/merchants/${merchantCode()}/readers`);
}

async function criarTransacaoMaquininha({ pedidoId, valor, descricao, readerId }) {
  const rid = readerId || process.env.SUMUP_READER_ID;
  if (!rid) throw new Error('SUMUP_READER_ID nÃ£o configurado no .env');
  return apiRequest('POST', `/v0.1/merchants/${merchantCode()}/readers/${rid}/checkout`, {
    total_amount: { value: Math.round(parseFloat(valor) * 100), currency: 'BRL', minor_unit: 2 },
    client_transaction_id: `lojao-${pedidoId}-${Date.now()}`,
    description: descricao || `Pedido #${pedidoId}`,
    return_url: `${process.env.APP_URL}/webhook/sumup`,
  });
}

async function consultarTransacaoMaquininha(clientTransactionId, readerId) {
  const rid = readerId || process.env.SUMUP_READER_ID;
  return apiRequest('GET', `/v0.1/merchants/${merchantCode()}/readers/${rid}/checkout/${clientTransactionId}`);
}

async function cancelarTransacaoMaquininha(clientTransactionId, readerId) {
  const rid = readerId || process.env.SUMUP_READER_ID;
  return apiRequest('DELETE', `/v0.1/merchants/${merchantCode()}/readers/${rid}/checkout/${clientTransactionId}`);
}
*/

// €€ Mapeamento de status €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€

function mapearStatus(status) {
  const mapa = {
    // Online checkout
    PAID: 'pago',
    SUCCESSFUL: 'pago',
    PENDING: 'pendente',
    PROCESSING: 'em_analise',
    FAILED: 'rejeitado',
    CANCELLED: 'cancelado',
    REFUNDED: 'estornado',
    // Cloud API (maquininha)
    successful: 'pago',
    in_progress: 'pendente',
    pending: 'pendente',
    failed: 'rejeitado',
    timed_out: 'cancelado',
    cancelled: 'cancelado',
  };
  return mapa[status] || 'pendente';
}

module.exports = {
  criarCheckoutOnline,
  consultarCheckout,
  mapearStatus,
};
