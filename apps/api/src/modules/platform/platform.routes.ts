import crypto from 'node:crypto';

import {
  createPlatformStoreSchema,
  platformLoginSchema,
  updatePlatformStoreSchema,
} from '@lojao/types/platform';
import { platformDashboardChartsQuerySchema } from '@lojao/types';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { requirePlatformAdmin } from '../../plugins/auth-guard.js';
import {
  applyMerchantPersona,
  applyPlatformPersona,
  preservedStashes,
  applyPreservedStashes,
} from '../../lib/session-persona.js';
import { getPlatformDashboardCharts } from './platform-dashboard-charts.service.js';
import {
  createPlatformStore,
  findStoreOwnerMember,
  getPlatformDashboardStats,
  getPlatformHealthSummary,
  getPlatformReportsSummary,
  getPlatformStoreBillingBySlug,
  getPlatformStoreBySlug,
  getPlatformStoreMetricsBySlug,
  listPlatformMerchantsQuery,
  listPlatformStores,
  listPlatformStoresQuery,
  updatePlatformStore,
} from './platform.service.js';

/** ID sentinela da sessão de operador da plataforma. */
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

async function handleEndImpersonation(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (!request.session.impersonation && !request.session.stashedPlatform) {
    await reply.code(400).send({
      error: 'Nenhuma impersonação ativa.',
      code: 'NOT_IMPERSONATING',
    });
    return;
  }

  const platform = request.session.stashedPlatform;
  request.session.impersonation = undefined;
  request.session.stashedMerchant = undefined;
  request.session.stashedBuyer = undefined;

  if (platform) {
    applyPlatformPersona(request.session, platform);
    request.session.stashedPlatform = undefined;
  } else {
    await request.session.destroy();
    await reply.send({ data: { ok: true } });
    return;
  }

  await request.session.save();
  await reply.send({ data: { ok: true } });
}

/**
 * Rotas do Platform Hub (`/api/v1/platform/*`). Operam no banco master e não
 * dependem de loja resolvida (o hook de `/api/v1` isenta `/platform/*`).
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

  /**
   * Fora do guard `requirePlatformAdmin`: durante impersonate a sessão ativa é
   * merchant (`owner`), mas `stashedPlatform` guarda o operador para restaurar.
   */
  app.post('/platform/end-impersonation', handleEndImpersonation);

  app.register(async (scoped) => {
    scoped.addHook('preHandler', requirePlatformAdmin);

    scoped.get('/platform/dashboard/stats', async (_request, reply) => {
      const data = await getPlatformDashboardStats();
      return reply.send({ data });
    });

    scoped.get('/platform/dashboard/charts', async (request, reply) => {
      const parsed = platformDashboardChartsQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.code(400).send({
          error: 'Parâmetros inválidos.',
          code: 'VALIDATION_ERROR',
          details: parsed.error.flatten().fieldErrors,
        });
      }
      const data = await getPlatformDashboardCharts(parsed.data.periodo);
      return reply.send({ data });
    });

    scoped.get('/platform/stores', async (request, reply) => {
      const q = request.query as Record<string, string | undefined>;
      const hasPagination =
        q.page !== undefined || q.limit !== undefined || q.q || q.status || q.plano;

      if (!hasPagination) {
        const data = await listPlatformStores();
        return reply.send({ data });
      }

      const page = q.page ? Number.parseInt(q.page, 10) : undefined;
      const limit = q.limit ? Number.parseInt(q.limit, 10) : undefined;
      const status =
        q.status === 'active' || q.status === 'suspended' ? q.status : undefined;

      const result = await listPlatformStoresQuery({
        q: q.q,
        status,
        plano: q.plano,
        page: Number.isFinite(page) ? page : undefined,
        limit: Number.isFinite(limit) ? limit : undefined,
      });

      return reply.send({
        data: result.items,
        meta: { page: result.page, perPage: result.limit, total: result.total },
      });
    });

    scoped.get('/platform/merchants', async (request, reply) => {
      const q = request.query as Record<string, string | undefined>;
      const page = q.page ? Number.parseInt(q.page, 10) : undefined;
      const limit = q.limit ? Number.parseInt(q.limit, 10) : undefined;
      const status =
        q.status === 'active' || q.status === 'suspended' ? q.status : undefined;

      const result = await listPlatformMerchantsQuery({
        q: q.q,
        status,
        page: Number.isFinite(page) ? page : undefined,
        limit: Number.isFinite(limit) ? limit : undefined,
      });

      return reply.send({
        data: result.items,
        meta: { page: result.page, perPage: result.limit, total: result.total },
      });
    });

    scoped.post('/platform/stores', async (request, reply) => {
      const parsed = createPlatformStoreSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: 'Dados inválidos.',
          code: 'VALIDATION_ERROR',
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const result = await createPlatformStore(parsed.data);
      if (!result.ok) {
        return reply
          .code(409)
          .send({ error: 'Já existe uma loja com esse slug.', code: 'SLUG_EXISTS' });
      }

      return reply.code(201).send({ data: result.store });
    });

    scoped.get('/platform/stores/:slug', async (request, reply) => {
      const slug = (request.params as { slug: string }).slug;
      const store = await getPlatformStoreBySlug(slug);
      if (!store) {
        return reply.code(404).send({ error: 'Loja não encontrada.', code: 'NOT_FOUND' });
      }
      return reply.send({ data: store });
    });

    scoped.get('/platform/stores/:slug/metrics', async (request, reply) => {
      const slug = (request.params as { slug: string }).slug;
      const metrics = await getPlatformStoreMetricsBySlug(slug);
      if (!metrics) {
        return reply.code(404).send({ error: 'Loja não encontrada.', code: 'NOT_FOUND' });
      }
      return reply.send({ data: metrics });
    });

    scoped.get('/platform/stores/:slug/billing', async (request, reply) => {
      const slug = (request.params as { slug: string }).slug;
      const billing = await getPlatformStoreBillingBySlug(slug);
      if (!billing) {
        return reply.code(404).send({ error: 'Loja não encontrada.', code: 'NOT_FOUND' });
      }
      return reply.send({ data: billing });
    });

    scoped.get('/platform/health', async (_request, reply) => {
      const data = await getPlatformHealthSummary();
      return reply.send({ data });
    });

    scoped.get('/platform/reports', async (_request, reply) => {
      const data = await getPlatformReportsSummary();
      return reply.send({ data });
    });

    scoped.patch('/platform/stores/:slug', async (request, reply) => {
      const slug = (request.params as { slug: string }).slug;
      const parsed = updatePlatformStoreSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: 'Dados inválidos.',
          code: 'VALIDATION_ERROR',
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const result = await updatePlatformStore(slug, parsed.data);
      if (!result.ok) {
        return reply.code(404).send({ error: 'Loja não encontrada.', code: 'NOT_FOUND' });
      }

      return reply.send({ data: result.store });
    });

    scoped.post('/platform/stores/:slug/impersonate', async (request, reply) => {
      const slug = (request.params as { slug: string }).slug;
      const owner = await findStoreOwnerMember(slug);
      if (!owner) {
        return reply.code(404).send({ error: 'Loja ou owner não encontrado.', code: 'NOT_FOUND' });
      }

      const operatorEmail = request.session.email ?? '';
      const preserved = preservedStashes(request.session);
      await request.session.regenerate();
      applyPreservedStashes(request.session, preserved);
      applyMerchantPersona(
        request.session,
        {
          memberId: owner.memberId,
          merchantId: owner.merchantId,
          merchantSlug: owner.merchantSlug,
          nome: owner.memberName,
          email: owner.memberEmail,
          role: owner.memberRole as 'owner',
        },
        { id: owner.storeId, slug: owner.storeSlug },
      );
      request.session.impersonation = {
        storeSlug: owner.storeSlug,
        memberId: owner.memberId,
        operatorEmail,
      };
      await request.session.save();

      const adminBase = (
        process.env.ADMIN_PUBLIC_URL ?? process.env.ADMIN_URL ?? 'http://localhost:5173'
      ).replace(/\/$/, '');

      return reply.send({
        data: {
          adminUrl: `${adminBase}/admin/dashboard`,
          store: { slug: owner.storeSlug, nome: owner.storeName },
          impersonation: request.session.impersonation,
        },
      });
    });
  });
}
