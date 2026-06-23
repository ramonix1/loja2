import crypto from 'node:crypto';

import {
  createTenantSchema,
  platformLoginSchema,
  updateTenantSchema,
} from '@lojao/types/platform';
import type { FastifyInstance, FastifyRequest } from 'fastify';

import { requirePlatformAdmin } from '../../plugins/auth-guard.js';
import { createTenant, getTenantBySlug, listTenants, updateTenant } from './platform.service.js';

/** ID sentinela da sessão de operador da plataforma (não corresponde a um usuário de tenant). */
const PLATFORM_USER_ID = -1;

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function masterCredentials(): { email: string; senha: string } | null {
  const email = process.env.MASTER_EMAIL?.trim();
  const senha = process.env.MASTER_PASSWORD;
  if (!email || !senha) return null;
  return { email: email.toLowerCase(), senha };
}

async function startPlatformSession(
  request: FastifyRequest,
  email: string,
): Promise<void> {
  await request.session.regenerate();
  request.session.usuarioId = PLATFORM_USER_ID;
  request.session.nome = 'Operador Ata Labs';
  request.session.email = email;
  request.session.role = 'platform_admin';
  await request.session.save();
}

/**
 * Rotas do Platform Hub (`/api/v1/platform/*`). Operam no banco master e não
 * dependem de tenant resolvido (o hook de `/api/v1` ignora tenant aqui).
 *
 * `POST /platform/login` autentica o operador via `MASTER_EMAIL`/`MASTER_PASSWORD`.
 * Demais rotas exigem `role === 'platform_admin'` (`requirePlatformAdmin`).
 */
export async function platformRoutes(app: FastifyInstance): Promise<void> {
  app.post('/platform/login', async (request, reply) => {
    const parsed = platformLoginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Dados inválidos.',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const creds = masterCredentials();
    if (!creds) {
      request.log.error('MASTER_EMAIL/MASTER_PASSWORD não configurados — login da plataforma indisponível.');
      return reply
        .code(503)
        .send({ error: 'Acesso à plataforma indisponível.', code: 'PLATFORM_UNAVAILABLE' });
    }

    const emailOk = timingSafeEqual(parsed.data.email.trim().toLowerCase(), creds.email);
    const senhaOk = timingSafeEqual(parsed.data.senha, creds.senha);
    if (!emailOk || !senhaOk) {
      return reply.code(401).send({ error: 'E-mail ou senha incorretos.', code: 'UNAUTHORIZED' });
    }

    await startPlatformSession(request, creds.email);
    return reply.send({
      data: { email: creds.email, role: 'platform_admin' },
    });
  });

  app.register(async (scoped) => {
    scoped.addHook('preHandler', requirePlatformAdmin);

    scoped.get('/platform/tenants', async (_request, reply) => {
      const data = await listTenants();
      return reply.send({ data });
    });

    scoped.post('/platform/tenants', async (request, reply) => {
      const parsed = createTenantSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: 'Dados inválidos.',
          code: 'VALIDATION_ERROR',
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const result = await createTenant(parsed.data);
      if (!result.ok) {
        return reply
          .code(409)
          .send({ error: 'Já existe uma loja com esse slug.', code: 'SLUG_EXISTS' });
      }

      return reply.code(201).send({ data: result.tenant });
    });

    scoped.get('/platform/tenants/:slug', async (request, reply) => {
      const slug = (request.params as { slug: string }).slug;
      const tenant = await getTenantBySlug(slug);
      if (!tenant) {
        return reply.code(404).send({ error: 'Loja não encontrada.', code: 'NOT_FOUND' });
      }
      return reply.send({ data: tenant });
    });

    scoped.patch('/platform/tenants/:slug', async (request, reply) => {
      const slug = (request.params as { slug: string }).slug;
      const parsed = updateTenantSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: 'Dados inválidos.',
          code: 'VALIDATION_ERROR',
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const result = await updateTenant(slug, parsed.data);
      if (!result.ok) {
        return reply.code(404).send({ error: 'Loja não encontrada.', code: 'NOT_FOUND' });
      }

      return reply.send({ data: result.tenant });
    });
  });
}
