import type { FastifyInstance } from 'fastify';

import { getTenant } from '../../lib/tenant-db.js';
import { resolveSlug } from '../../plugins/tenant.js';
import { processStripeWebhook, processSumupWebhook } from './webhook.service.js';

/**
 * Rotas de webhook — sem prefixo `/api/v1`, sem CSRF.
 * Registradas diretamente em `app.ts`.
 */
export async function webhookRoutes(app: FastifyInstance): Promise<void> {
  app.post('/webhook/stripe', {
    config: { rawBody: true },
  }, async (request, reply) => {
    const slug = resolveSlug(request);
    if (!slug) {
      app.log.warn({ path: '/webhook/stripe' }, 'Webhook Stripe sem tenant');
      return reply.code(200).send({ received: true });
    }

    try {
      const { pool, tenant } = await getTenant(slug);
      const event = request.body as {
        id?: string;
        type?: string;
        data?: { object?: Record<string, unknown> };
      };

      app.log.info({ eventId: event.id, type: event.type, tenant: slug }, 'Webhook Stripe');

      const result = await processStripeWebhook(pool, event, tenant.id);
      return reply.code(200).send({ received: true, ...result });
    } catch (err) {
      app.log.error({ err }, 'Erro webhook Stripe');
      return reply.code(200).send({ received: true });
    }
  });

  app.post('/webhook/sumup', async (request, reply) => {
    const slug = resolveSlug(request);
    if (!slug) {
      return reply.code(200).send({ received: true });
    }

    try {
      const { pool, tenant } = await getTenant(slug);
      const evento = request.body as Record<string, unknown>;
      app.log.info({ tenant: slug, evento }, 'Webhook SumUp');
      const result = await processSumupWebhook(pool, evento, tenant.id);
      return reply.code(200).send({ received: true, ...result });
    } catch (err) {
      app.log.error({ err }, 'Erro webhook SumUp');
      return reply.code(200).send({ received: true });
    }
  });
}
