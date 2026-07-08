import { createStoreSchema, merchantSignupSchema } from '@lojao/types/merchant';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { populateMerchantSession } from '../../lib/merchant-session.js';
import {
  checkMerchantSlugAvailability,
  checkStoreSlugAvailability,
  signupMerchantAccount,
} from './merchant-signup.service.js';
import { createStoreForMerchant } from './merchant.service.js';

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 8;
const ipHits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (ipHits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  hits.push(now);
  ipHits.set(ip, hits);
  return hits.length > RATE_LIMIT_MAX;
}

function enforceRateLimit(request: FastifyRequest, reply: FastifyReply): boolean {
  if (process.env.NODE_ENV === 'test') return false;
  if (rateLimited(request.ip)) {
    reply
      .code(429)
      .send({ error: 'Muitas tentativas. Tente novamente em alguns minutos.', code: 'RATE_LIMITED' });
    return true;
  }
  return false;
}

export async function checkMerchantSlug(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { type, slug } = request.query as { type?: string; slug?: string };
  if (!slug || !slug.trim()) {
    return reply.code(400).send({ error: 'Informe um slug.', code: 'VALIDATION_ERROR' });
  }
  const normalized = slug.trim().toLowerCase();

  if (type === 'merchant') {
    const availability = await checkMerchantSlugAvailability(normalized);
    return reply.send({ data: { slug: normalized, available: availability.available } });
  }

  const availability = await checkStoreSlugAvailability(normalized);
  return reply.send({
    data: {
      slug: normalized,
      available: availability.available,
      ...(availability.available ? {} : { reason: availability.reason }),
    },
  });
}

export async function postMerchantSignup(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (enforceRateLimit(request, reply)) return;

  const parsed = merchantSignupSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({
      error: 'Dados inválidos.',
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const outcome = await signupMerchantAccount(parsed.data, {
    log: (msg) => request.log.info(msg),
  });

  if (!outcome.ok) {
    const status: Record<typeof outcome.code, number> = {
      ENTERPRISE_CONTACT: 422,
      MERCHANT_SLUG_EXISTS: 409,
      STORE_SLUG_RESERVED: 409,
      STORE_SLUG_EXISTS: 409,
      PROVISION_ERROR: 500,
    };
    return reply.code(status[outcome.code]).send({ error: outcome.message, code: outcome.code });
  }

  await populateMerchantSession(request, outcome.session.member, outcome.session.store);
  return reply.code(201).send({ data: outcome.result });
}

export async function postCreateStore(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const merchantId = Number((request.params as { merchantId: string }).merchantId);
  if (!Number.isInteger(merchantId)) {
    return reply.code(400).send({ error: 'Id de conta inválido.', code: 'VALIDATION_ERROR' });
  }

  if (request.session.merchantId !== merchantId) {
    return reply.code(403).send({ error: 'Você não tem acesso a esta conta.', code: 'FORBIDDEN' });
  }

  const parsed = createStoreSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({
      error: 'Dados inválidos.',
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const result = await createStoreForMerchant(merchantId, parsed.data);
  if (!result.ok) {
    const status: Record<typeof result.code, number> = {
      SLUG_EXISTS: 409,
      STORE_LIMIT_REACHED: 403,
      MERCHANT_NOT_FOUND: 404,
    };
    const messages: Record<typeof result.code, string> = {
      SLUG_EXISTS: 'Já existe uma loja com esse slug.',
      STORE_LIMIT_REACHED: 'Limite de lojas do plano atingido.',
      MERCHANT_NOT_FOUND: 'Conta não encontrada.',
    };
    return reply.code(status[result.code]).send({ error: messages[result.code], code: result.code });
  }

  return reply.code(201).send({ data: result.store });
}
