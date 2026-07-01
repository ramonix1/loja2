export interface StripeWebhookEvent {
  id?: string;
  type?: string;
  data?: { object?: Record<string, unknown> };
}

export type SumupWebhookEvent = Record<string, unknown>;

export interface WebhookProcessResult {
  processed: boolean;
  pedidoId?: number | null;
}
