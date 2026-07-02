import { createStoreSchema, merchantSignupSchema } from '@lojao/types/merchant';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { populateMerchantSession } from '../../lib/merchant-session.js';
import { requireMerchantOwner } from '../../plugins/auth-guard.js';
import {
  checkMerchantSlugAvailability,
  checkStoreSlugAvailability,
  signupMerchantAccount,
} from './merchant-signup.service.js';
import { createStoreForMerchant } from './merchant.service.js';

/**
 * MA6 — rotas do modelo **merchant account** (spec §5, §8 "Signup + criar
 * loja adicional"):
 *
 * - `POST /public/merchant-signup` (+ `check-slug`) — primitivo de signup
 *   self-service (conta + owner + loja #1). **Não** wired na UI de marketing
 *   ainda (continua em `/public/signup`, modelo tenant) — ver assunções MA6.
 * - `POST /merchants/:merchantId/stores` — cria loja #2, #3… dentro de uma
 *   conta já autenticada, com enforcement de `max_stores` (403
 *   `STORE_LIMIT_REACHED`).
 */

/** Rate limit em memória por IP — mesmo padrão de `signup.routes.ts`. */
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
  // Desabilitado em testes para manter a suíte determinística (mesmo IP).
  if (process.env.NODE_ENV === 'test') return false;
  if (rateLimited(request.ip)) {
    reply
      .code(429)
      .send({ error: 'Muitas tentativas. Tente novamente em alguns minutos.', code: 'RATE_LIMITED' });
    return true;
  }
  return false;
}

export async function merchantRoutes(app: FastifyInstance): Promise<void> {
  app.get('/public/merchant-signup/check-slug', async (request, reply) => {
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
  });

  app.post('/public/merchant-signup', async (request, reply) => {
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
  });

  /**
   * Cria loja adicional (#2, #3…) numa conta já existente. `merchantId` do
   * path deve ser o mesmo da sessão (self-service; criar lojas em contas de
   * terceiros não é suportado nesta fase — decisão conservadora, ver
   * assunções MA6).
   */
  app.post(
    '/merchants/:merchantId/stores',
    { preHandler: requireMerchantOwner },
    async (request, reply) => {
      const merchantId = Number((request.params as { merchantId: string }).merchantId);
      if (!Number.isInteger(merchantId)) {
        return reply.code(400).send({ error: 'Id de conta inválido.', code: 'VALIDATION_ERROR' });
      }

      if (request.session.merchantId !== merchantId) {
        return reply
          .code(403)
          .send({ error: 'Você não tem acesso a esta conta.', code: 'FORBIDDEN' });
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
    },
  );
}
