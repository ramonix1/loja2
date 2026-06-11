const masterDb = require('../config/masterDb');

const BASE_URLS = {
  production: 'https://api.asaas.com/v3',
  sandbox:    'https://sandbox.asaas.com/api/v3',
};

// Cache simples — invalidado ao salvar platform_config
let _configCache = null;

async function getPlatformConfig() {
  if (_configCache) return _configCache;
  const r = await masterDb.query('SELECT chave, valor FROM platform_config');
  _configCache = Object.fromEntries(r.rows.map(({ chave, valor }) => [chave, valor]));
  return _configCache;
}

function invalidarCache() {
  _configCache = null;
}

async function _request(method, path, body, apiKey) {
  const config = await getPlatformConfig();
  const env = config.asaas_env === 'production' ? 'production' : 'sandbox';
  const token = apiKey || config.asaas_api_key;

  if (!token) throw new Error('Chave da API Asaas não configurada em platform_config');

  const res = await fetch(`${BASE_URLS[env]}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'access_token': token,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = json.errors?.[0]?.description || json.message || `HTTP ${res.status}`;
    throw new Error(`Asaas API: ${msg}`);
  }

  return json;
}

// --------------------------------------------------------------------------
// Subcontas
// --------------------------------------------------------------------------

/**
 * Cria uma subconta Asaas para um tenant.
 * Retorna { id, walletId, apiKey } — salve no banco do tenant.
 */
async function criarSubconta({ nome, email, cpfCnpj, telefone, site, tipoEmpresa }) {
  const data = await _request('POST', '/accounts', {
    name:        nome,
    email,
    cpfCnpj:     cpfCnpj.replace(/\D/g, ''),
    mobilePhone: telefone?.replace(/\D/g, ''),
    site,
    companyType: tipoEmpresa || 'MEI', // MEI | LIMITED | INDIVIDUAL | ASSOCIATION
  });

  return {
    id:       data.id,
    walletId: data.walletId,
    apiKey:   data.apiKey,
  };
}

// --------------------------------------------------------------------------
// Clientes Asaas (vinculados à conta plataforma)
// --------------------------------------------------------------------------

async function obterOuCriarCliente({ nome, email, cpfCnpj, telefone }) {
  const cpfLimpo = cpfCnpj?.replace(/\D/g, '') || '';

  // Tenta localizar pelo CPF/CNPJ primeiro
  if (cpfLimpo) {
    const busca = await _request('GET', `/customers?cpfCnpj=${cpfLimpo}&limit=1`);
    if (busca.data?.length > 0) return busca.data[0];
  }

  return _request('POST', '/customers', {
    name:        nome,
    email,
    cpfCnpj:     cpfLimpo || undefined,
    mobilePhone: telefone?.replace(/\D/g, '') || undefined,
  });
}

// --------------------------------------------------------------------------
// Cobranças com split
// --------------------------------------------------------------------------

/**
 * Cria uma cobrança na conta plataforma com split para o tenant.
 *
 * @param {object} opts
 * @param {string} opts.customerId       - ID do cliente Asaas
 * @param {number} opts.valor            - valor total em R$
 * @param {string} opts.vencimento       - 'YYYY-MM-DD'
 * @param {string} opts.tipoPagamento    - 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'UNDEFINED'
 * @param {string} opts.descricao
 * @param {number} opts.pedidoId         - referência externa
 * @param {string|null} opts.walletId    - wallet do tenant (null = sem split)
 * @param {number} opts.feePercent       - percentual retido pela plataforma (0–100)
 */
async function criarCobranca({ customerId, valor, vencimento, tipoPagamento, descricao, pedidoId, walletId, feePercent }) {
  const valorTotal   = parseFloat(valor);
  const valorTenant  = walletId
    ? parseFloat((valorTotal * (1 - feePercent / 100)).toFixed(2))
    : null;

  const payload = {
    customer:          customerId,
    billingType:       tipoPagamento || 'UNDEFINED',
    value:             valorTotal,
    dueDate:           vencimento || _proximoDiaUtil(),
    description:       descricao,
    externalReference: String(pedidoId),
  };

  if (walletId && valorTenant > 0) {
    payload.split = [{ walletId, fixedValue: valorTenant }];
  }

  return _request('POST', '/payments', payload);
}

// --------------------------------------------------------------------------
// Consulta e status
// --------------------------------------------------------------------------

async function consultarPagamento(pagamentoId) {
  return _request('GET', `/payments/${pagamentoId}`);
}

async function obterQrCodePix(pagamentoId) {
  return _request('GET', `/payments/${pagamentoId}/pixQrCode`);
}

async function obterIdentificacaoBoleto(pagamentoId) {
  return _request('GET', `/payments/${pagamentoId}/identificationField`);
}

// --------------------------------------------------------------------------
// Webhook
// --------------------------------------------------------------------------

/**
 * Valida o token do webhook e retorna o payload.
 * Lança erro se o token for inválido.
 */
async function processarWebhook(payload, tokenRecebido) {
  const config = await getPlatformConfig();
  const tokenEsperado = config.asaas_webhook_token;
  if (tokenEsperado && tokenRecebido !== tokenEsperado) {
    throw new Error('Token de webhook inválido');
  }
  return payload;
}

// --------------------------------------------------------------------------
// Taxa efetiva por tenant
// --------------------------------------------------------------------------

/**
 * Retorna o percentual de fee para o tenant.
 * Usa fee_percent_override se definido; caso contrário, usa o padrão da plataforma.
 */
async function getFeePercent(tenant) {
  if (tenant.fee_percent_override !== null && tenant.fee_percent_override !== undefined) {
    return parseFloat(tenant.fee_percent_override);
  }
  const config = await getPlatformConfig();
  return parseFloat(config.asaas_default_fee_percent || '1.50');
}

// --------------------------------------------------------------------------
// Status Asaas → interno
// --------------------------------------------------------------------------

const STATUS_MAP = {
  PENDING:            'pendente',
  RECEIVED:           'pago',
  CONFIRMED:          'pago',
  OVERDUE:            'vencido',
  REFUNDED:           'reembolsado',
  RECEIVED_IN_CASH:   'pago',
  REFUND_REQUESTED:   'reembolso_solicitado',
  CHARGEBACK_DISPUTE: 'chargeback',
  DUNNING_REQUESTED:  'cobranca_enviada',
  DUNNING_RECEIVED:   'pago',
  AWAITING_RISK_ANALYSIS: 'analise',
};

function mapearStatus(statusAsaas) {
  return STATUS_MAP[statusAsaas] || 'pendente';
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function _proximoDiaUtil() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

module.exports = {
  getPlatformConfig,
  invalidarCache,
  criarSubconta,
  obterOuCriarCliente,
  criarCobranca,
  consultarPagamento,
  obterQrCodePix,
  obterIdentificacaoBoleto,
  processarWebhook,
  getFeePercent,
  mapearStatus,
};
