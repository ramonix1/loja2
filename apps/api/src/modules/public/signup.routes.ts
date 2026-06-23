import { signupSchema, type SignupPlan } from '@lojao/types/signup';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import {
  checkSlugAvailability,
  listSignupPlans,
  provisionSignup,
} from './signup.service.js';

/**
 * Rate limit em memória por IP para o signup (anti-abuso básico). Janela
 * deslizante simples; produção multi-instância deve usar store compartilhado.
 */
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

/**
 * API pública de onboarding self-service (Fase G). Sem tenant, sem sessão
 * lojista — o hook de `/api/v1` isenta `/public/signup` da resolução de tenant.
 */
export async function signupRoutes(app: FastifyInstance): Promise<void> {
  app.get('/public/signup/plans', async (_request, reply) => {
    return reply.send({ data: listSignupPlans() });
  });

  app.get('/public/signup/check-slug', async (request, reply) => {
    const slug = (request.query as { slug?: string }).slug;
    if (!slug || !slug.trim()) {
      return reply.code(400).send({ error: 'Informe um slug.', code: 'VALIDATION_ERROR' });
    }
    const availability = await checkSlugAvailability(slug);
    return reply.send({
      data: {
        slug: slug.trim().toLowerCase(),
        available: availability.available,
        ...(availability.available ? {} : { reason: availability.reason }),
      },
    });
  });

  app.post('/public/signup/preview', async (request, reply) => {
    if (enforceRateLimit(request, reply)) return;

    const parsed = signupSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Dados inválidos.',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    if (parsed.data.planSlug === 'enterprise') {
      return reply.code(422).send({
        error: 'Plano Enterprise requer contato com o time comercial.',
        code: 'ENTERPRISE_CONTACT',
      });
    }

    const availability = await checkSlugAvailability(parsed.data.loja.slug);
    if (!availability.available) {
      const code = availability.reason === 'RESERVED' ? 'SLUG_RESERVED' : 'SLUG_EXISTS';
      return reply.code(409).send({
        error: availability.reason === 'RESERVED'
          ? 'Este slug é reservado. Escolha outro.'
          : 'Já existe uma loja com esse slug.',
        code,
      });
    }

    return reply.send({
      data: {
        valid: true,
        planSlug: parsed.data.planSlug,
        billingCycle: parsed.data.billingCycle,
        loja: parsed.data.loja,
      },
    });
  });

  app.post('/public/signup', async (request, reply) => {
    if (enforceRateLimit(request, reply)) return;

    const parsed = signupSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Dados inválidos.',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const idempotencyKey =
      (request.headers['idempotency-key'] as string | undefined) ?? null;

    const outcome = await provisionSignup(parsed.data, {
      idempotencyKey,
      log: (msg) => request.log.info(msg),
    });

    if (!outcome.ok) {
      const status: Record<typeof outcome.code, number> = {
        ENTERPRISE_CONTACT: 422,
        SLUG_RESERVED: 409,
        SLUG_EXISTS: 409,
        PROVISION_ERROR: 500,
      };
      return reply.code(status[outcome.code]).send({
        error: outcome.message,
        code: outcome.code,
      });
    }

    return reply.code(201).send({ data: outcome.result });
  });
}

export type { SignupPlan };
