const Stripe = require('stripe');

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY não configurado');
  return Stripe(process.env.STRIPE_SECRET_KEY);
}

async function criarPagamentoPix({ pedidoId, valor, descricao }) {
  return getStripe().paymentIntents.create({
    amount: Math.round(parseFloat(valor) * 100),
    currency: 'brl',
    payment_method_types: ['pix'],
    payment_method_data: { type: 'pix' },
    confirm: true,
    description: descricao,
    metadata: { pedido_id: String(pedidoId) },
    payment_method_options: { pix: { expires_after_seconds: 86400 } },
  });
}

async function criarPagamentoCartao({ pedidoId, valor, paymentMethodId, descricao }) {
  return getStripe().paymentIntents.create({
    amount: Math.round(parseFloat(valor) * 100),
    currency: 'brl',
    payment_method_types: ['card'],
    payment_method: paymentMethodId,
    confirm: true,
    description: descricao,
    metadata: { pedido_id: String(pedidoId) },
    return_url: `${process.env.APP_URL}/checkout/resultado/${pedidoId}`,
  });
}

async function criarBoleto({ pedidoId, valor, nome, email, cpf, cep, logradouro, numero, cidade, estado, descricao }) {
  return getStripe().paymentIntents.create({
    amount: Math.round(parseFloat(valor) * 100),
    currency: 'brl',
    payment_method_types: ['boleto'],
    payment_method_data: {
      type: 'boleto',
      boleto: { tax_id: (cpf || '00000000000').replace(/\D/g, '') },
      billing_details: {
        name: nome,
        email: email,
        address: {
          line1: `${logradouro || ''}, ${numero || ''}`,
          city: cidade || '',
          state: estado || '',
          postal_code: (cep || '').replace(/\D/g, ''),
          country: 'BR',
        }
      }
    },
    confirm: true,
    description: descricao,
    metadata: { pedido_id: String(pedidoId) },
  });
}

async function consultarPagamento(paymentIntentId) {
  return getStripe().paymentIntents.retrieve(paymentIntentId);
}

function mapearStatus(stripeStatus) {
  const mapa = {
    succeeded: 'pago',
    requires_payment_method: 'pendente',
    requires_confirmation: 'pendente',
    requires_action: 'pendente',
    processing: 'em_analise',
    canceled: 'cancelado',
  };
  return mapa[stripeStatus] || 'pendente';
}

module.exports = { criarPagamentoPix, criarPagamentoCartao, criarBoleto, consultarPagamento, mapearStatus };
