import type { FastifyInstance } from 'fastify';

import { stripeWebhookHandler, sumupWebhookHandler } from './webhook.controller.js';

/**
 * Rotas de webhook — sem prefixo `/api/v1`, sem CSRF.
 * Registradas diretamente em `app.ts`.
 */
export async function webhookRoutes(app: FastifyInstance): Promise<void> {
  app.post('/webhook/stripe', { config: { rawBody: true } }, stripeWebhookHandler);
  app.post('/webhook/sumup', sumupWebhookHandler);
}
