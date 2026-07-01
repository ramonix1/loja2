import type { FastifyReply, FastifyRequest } from 'fastify';

import { getTenant } from '../../lib/tenant-db.js';
import { resolveSlug } from '../../plugins/tenant.js';
import type { StripeWebhookEvent, SumupWebhookEvent } from './webhook.schema.js';
import { processStripeWebhook, processSumupWebhook } from './webhook.service.js';

export async function stripeWebhookHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const slug = resolveSlug(request);
  if (!slug) {
    request.server.log.warn({ path: '/webhook/stripe' }, 'Webhook Stripe sem tenant');
    reply.code(200).send({ received: true });
    return;
  }

  try {
    const { pool, tenant } = await getTenant(slug);
    const event = request.body as StripeWebhookEvent;

    request.server.log.info({ eventId: event.id, type: event.type, tenant: slug }, 'Webhook Stripe');

    const result = await processStripeWebhook(pool, event, tenant.id);
    reply.code(200).send({ received: true, ...result });
  } catch (err) {
    request.server.log.error({ err }, 'Erro webhook Stripe');
    reply.code(200).send({ received: true });
  }
}

export async function sumupWebhookHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const slug = resolveSlug(request);
  if (!slug) {
    reply.code(200).send({ received: true });
    return;
  }

  try {
    const { pool, tenant } = await getTenant(slug);
    const evento = request.body as SumupWebhookEvent;
    request.server.log.info({ tenant: slug, evento }, 'Webhook SumUp');
    const result = await processSumupWebhook(pool, evento, tenant.id);
    reply.code(200).send({ received: true, ...result });
  } catch (err) {
    request.server.log.error({ err }, 'Erro webhook SumUp');
    reply.code(200).send({ received: true });
  }
}
