import Stripe from 'stripe';

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY não configurado');
  return new Stripe(key);
}

export interface StripePaymentInput {
  pedidoId: number;
  valor: number;
  descricao: string;
  email?: string;
  nome?: string;
  cpf?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  paymentMethodId?: string;
}

export async function criarPagamentoPix(input: StripePaymentInput): Promise<Stripe.PaymentIntent> {
  return getStripe().paymentIntents.create({
    amount: Math.round(parseFloat(String(input.valor)) * 100),
    currency: 'brl',
    payment_method_types: ['pix'],
    payment_method_data: { type: 'pix' },
    confirm: true,
    description: input.descricao,
    metadata: { pedido_id: String(input.pedidoId) },
    payment_method_options: { pix: { expires_after_seconds: 86400 } },
  });
}

export async function criarPagamentoCartao(
  input: StripePaymentInput,
): Promise<Stripe.PaymentIntent> {
  if (!input.paymentMethodId) throw new Error('paymentMethodId obrigatório');
  return getStripe().paymentIntents.create({
    amount: Math.round(parseFloat(String(input.valor)) * 100),
    currency: 'brl',
    payment_method_types: ['card'],
    payment_method: input.paymentMethodId,
    confirm: true,
    description: input.descricao,
    metadata: { pedido_id: String(input.pedidoId) },
    return_url: `${process.env.APP_URL ?? 'http://localhost:3000'}/checkout/resultado/${input.pedidoId}`,
  });
}

export async function criarBoleto(input: StripePaymentInput): Promise<Stripe.PaymentIntent> {
  return getStripe().paymentIntents.create({
    amount: Math.round(parseFloat(String(input.valor)) * 100),
    currency: 'brl',
    payment_method_types: ['boleto'],
    payment_method_data: {
      type: 'boleto',
      boleto: { tax_id: (input.cpf || '00000000000').replace(/\D/g, '') },
      billing_details: {
        name: input.nome ?? '',
        email: input.email ?? '',
        address: {
          line1: `${input.logradouro ?? ''}, ${input.numero ?? ''}`,
          city: input.cidade ?? '',
          state: input.estado ?? '',
          postal_code: (input.cep ?? '').replace(/\D/g, ''),
          country: 'BR',
        },
      },
    },
    confirm: true,
    description: input.descricao,
    metadata: { pedido_id: String(input.pedidoId) },
  });
}

export async function consultarPagamento(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  return getStripe().paymentIntents.retrieve(paymentIntentId);
}

export function mapearStatus(stripeStatus: string): string {
  const mapa: Record<string, string> = {
    succeeded: 'pago',
    requires_payment_method: 'pendente',
    requires_confirmation: 'pendente',
    requires_action: 'pendente',
    processing: 'em_analise',
    canceled: 'cancelado',
  };
  return mapa[stripeStatus] ?? 'pendente';
}

export function verifyWebhookSignature(
  rawBody: Buffer | string,
  signature: string,
): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return JSON.parse(typeof rawBody === 'string' ? rawBody : rawBody.toString()) as Stripe.Event;
  }
  return getStripe().webhooks.constructEvent(rawBody, signature, secret);
}
