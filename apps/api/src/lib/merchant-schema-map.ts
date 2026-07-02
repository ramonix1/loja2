/**
 * MA8 — mapeamentos entre valores persistidos (schema EN) e payloads pt-BR da API v1.
 * UI permanece pt-BR; banco greenfield usa inglês (db-schema-english.md).
 */

const ORDER_STATUS_TO_API: Record<string, string> = {
  awaiting_payment: 'aguardando_pagamento',
  paid: 'pago',
  in_separation: 'em_separacao',
  shipped: 'enviado',
  delivered: 'entregue',
  cancelled: 'cancelado',
};

const ORDER_STATUS_FROM_API: Record<string, string> = Object.fromEntries(
  Object.entries(ORDER_STATUS_TO_API).map(([en, pt]) => [pt, en]),
);

export function orderStatusToApi(status: string): string {
  return ORDER_STATUS_TO_API[status] ?? status;
}

export function orderStatusFromApi(status: string): string {
  return ORDER_STATUS_FROM_API[status] ?? status;
}

/** Status internos dos mappers Stripe/SumUp (PT) → coluna `payments.status` (EN). */
const PAYMENT_STATUS_TO_DB: Record<string, string> = {
  pago: 'paid',
  pendente: 'pending',
  em_analise: 'processing',
  rejeitado: 'rejected',
  cancelado: 'cancelled',
  estornado: 'refunded',
};

const PAYMENT_STATUS_TO_API: Record<string, string> = {
  paid: 'pago',
  pending: 'pendente',
  processing: 'em_analise',
  rejected: 'rejeitado',
  cancelled: 'cancelado',
  refunded: 'estornado',
};

export function paymentStatusToDb(status: string): string {
  return PAYMENT_STATUS_TO_DB[status] ?? status;
}

export function paymentStatusToApi(status: string): string {
  return PAYMENT_STATUS_TO_API[status] ?? status;
}

const APPOINTMENT_STATUS_TO_API: Record<string, string> = {
  confirmed: 'confirmado',
  cancelled: 'cancelado',
};

const APPOINTMENT_STATUS_FROM_API: Record<string, string> = Object.fromEntries(
  Object.entries(APPOINTMENT_STATUS_TO_API).map(([en, pt]) => [pt, en]),
);

export function appointmentStatusToApi(status: string): string {
  return APPOINTMENT_STATUS_TO_API[status] ?? status;
}

export function appointmentStatusFromApi(status: string): string {
  return APPOINTMENT_STATUS_FROM_API[status] ?? status;
}

const CHAT_STATUS_TO_API: Record<string, string> = {
  open: 'aberta',
  closed: 'encerrada',
};

export function chatStatusToApi(status: string): string {
  return CHAT_STATUS_TO_API[status] ?? status;
}

/** Keys legadas (configuracoes PT) → store_settings EN (db-schema-english.md §4.1). */
export const SETTING_KEY_TO_EN: Record<string, string> = {
  loja_nome: 'store.display_name',
  loja_slogan: 'store.tagline',
  loja_logo: 'store.logo_url',
  loja_favicon: 'store.favicon_url',
  loja_cor_primaria: 'store.primary_color',
  loja_rodape: 'store.footer_text',
  loja_email: 'store.contact_email',
  loja_whatsapp: 'store.contact_whatsapp',
  controla_estoque: 'inventory.enabled',
  reservar_estoque_carrinho: 'inventory.reserve_on_cart',
  modulo_agenda: 'schedule.enabled',
  habilitar_sumup: 'payments.sumup_enabled',
  frete_cep_origem: 'shipping.origin_postal_code',
  frete_fixo: 'shipping.flat_rate',
  frete_gratis_acima: 'shipping.free_above',
  melhor_envio_token: 'shipping.melhor_envio_token',
  melhor_envio_sandbox: 'shipping.melhor_envio_sandbox',
  frete_peso_padrao: 'shipping.default_weight_g',
  frete_altura: 'shipping.default_height_cm',
  frete_largura: 'shipping.default_width_cm',
  frete_comprimento: 'shipping.default_length_cm',
};

export const SETTING_KEY_FROM_EN: Record<string, string> = Object.fromEntries(
  Object.entries(SETTING_KEY_TO_EN).map(([pt, en]) => [en, pt]),
);

export function settingKeyToEn(key: string): string {
  return SETTING_KEY_TO_EN[key] ?? key;
}

export function settingKeyFromEn(key: string): string {
  return SETTING_KEY_FROM_EN[key] ?? key;
}
