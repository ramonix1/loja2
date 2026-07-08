import type { FastifyInstance } from 'fastify';

import { handleStripeWebhook, handleSumupWebhook } from './webhook.controller.js';

/**
 * Rotas de webhook — sem prefixo `/api/v1`, sem CSRF.
 * Registradas diretamente em `app.ts`.
 */
export async function webhookRouter(app: FastifyInstance): Promise<void> {
  app.post('/webhook/stripe', handleStripeWebhook);
  app.post('/webhook/sumup', handleSumupWebhook);
}
