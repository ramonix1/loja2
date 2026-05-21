const { MercadoPagoConfig, Payment, Preference } = require('mercadopago');

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
  options: { timeout: 5000 }
});

const payment = new Payment(client);
const preference = new Preference(client);

/**
 * Cria pagamento PIX
 */
async function criarPagamentoPix({ pedidoId, valor, email, nome, cpf, descricao }) {
  const body = {
    transaction_amount: parseFloat(valor),
    description: descricao || `Pedido #${pedidoId}`,
    payment_method_id: 'pix',
    payer: {
      email,
      first_name: nome.split(' ')[0],
      last_name: nome.split(' ').slice(1).join(' ') || nome.split(' ')[0],
      identification: { type: 'CPF', number: cpf?.replace(/\D/g, '') || '00000000000' }
    },
    external_reference: String(pedidoId),
    ...(process.env.NODE_ENV === 'production' && { notification_url: `${process.env.APP_URL}/webhook/mercadopago` })
  };
  return payment.create({ body });
}

/**
 * Cria pagamento com cartão de crédito/débito (token gerado no front via SDK JS)
 */
async function criarPagamentoCartao({ pedidoId, valor, token, parcelas, metodoPagamento, email, nome, cpf, descricao }) {
  const body = {
    transaction_amount: parseFloat(valor),
    token,
    installments: parcelas || 1,
    payment_method_id: metodoPagamento,
    description: descricao || `Pedido #${pedidoId}`,
    payer: {
      email,
      identification: { type: 'CPF', number: cpf?.replace(/\D/g, '') || '00000000000' }
    },
    external_reference: String(pedidoId),
    ...(process.env.NODE_ENV === 'production' && { notification_url: `${process.env.APP_URL}/webhook/mercadopago` }),
    statement_descriptor: 'LOJAO'
  };
  return payment.create({ body });
}

/**
 * Cria boleto bancário
 */
async function criarBoleto({ pedidoId, valor, email, nome, cpf, cep, logradouro, numero, bairro, cidade, estado, descricao }) {
  const body = {
    transaction_amount: parseFloat(valor),
    description: descricao || `Pedido #${pedidoId}`,
    payment_method_id: 'bolbradesco',
    payer: {
      email,
      first_name: nome.split(' ')[0],
      last_name: nome.split(' ').slice(1).join(' ') || nome.split(' ')[0],
      identification: { type: 'CPF', number: cpf?.replace(/\D/g, '') || '00000000000' },
      address: {
        zip_code: cep?.replace(/\D/g, ''),
        street_name: logradouro,
        street_number: numero,
        neighborhood: bairro,
        city: cidade,
        federal_unit: estado
      }
    },
    external_reference: String(pedidoId),
    ...(process.env.NODE_ENV === 'production' && { notification_url: `${process.env.APP_URL}/webhook/mercadopago` })
  };
  return payment.create({ body });
}

/**
 * Consulta status de um pagamento pelo ID do MP
 */
async function consultarPagamento(paymentId) {
  return payment.get({ id: paymentId });
}

/**
 * Mapeia status do MP para status interno
 */
function mapearStatus(mpStatus, mpStatusDetail) {
  const mapa = {
    approved: 'pago',
    pending: 'pendente',
    in_process: 'em_analise',
    rejected: 'rejeitado',
    cancelled: 'cancelado',
    refunded: 'estornado',
    charged_back: 'estornado'
  };
  return mapa[mpStatus] || 'pendente';
}

module.exports = {
  criarPagamentoPix,
  criarPagamentoCartao,
  criarBoleto,
  consultarPagamento,
  mapearStatus
};
