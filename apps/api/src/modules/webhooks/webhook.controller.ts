import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { getStoreBySlug } from '../../lib/merchant-db.js';
import { resolveStoreSlug } from '../../plugins/store.js';
import { processStripeWebhook, processSumupWebhook } from './webhook.service.js';

export async function handleStripeWebhook(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const app = request.server as FastifyInstance;
  const slug = resolveStoreSlug(request);
  if (!slug) {
    app.log.warn({ path: '/webhook/stripe' }, 'Webhook Stripe sem loja');
    return reply.code(200).send({ received: true });
  }

  try {
    const { pool, merchant } = await getStoreBySlug(slug);
    const event = request.body as {
      id?: string;
      type?: string;
      data?: { object?: Record<string, unknown> };
    };

    app.log.info({ eventId: event.id, type: event.type, store: slug }, 'Webhook Stripe');

    const result = await processStripeWebhook(pool, event, merchant.id);
    return reply.code(200).send({ received: true, ...result });
  } catch (err) {
    app.log.error({ err }, 'Erro webhook Stripe');
    return reply.code(200).send({ received: true });
  }
}

export async function handleSumupWebhook(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const app = request.server as FastifyInstance;
  const slug = resolveStoreSlug(request);
  if (!slug) {
    return reply.code(200).send({ received: true });
  }

  try {
    const { pool, merchant } = await getStoreBySlug(slug);
    const evento = request.body as Record<string, unknown>;
    app.log.info({ store: slug, evento }, 'Webhook SumUp');
    const result = await processSumupWebhook(pool, evento, merchant.id);
    return reply.code(200).send({ received: true, ...result });
  } catch (err) {
    app.log.error({ err }, 'Erro webhook SumUp');
    return reply.code(200).send({ received: true });
  }
}
