import type { FastifyReply, FastifyRequest } from 'fastify';

import { getCachedTenantDb } from '@lojao/db';

import { resolveLoginTenant } from '../lib/resolve-login-tenant.js';
import { getTenant } from '../lib/tenant-db.js';

let warnedTenantSlugEnv = false;

/**
 * Resolve o slug do tenant a partir da requisição.
 * Prioridade: sessão > header `X-Tenant-Slug` > subdomínio.
 * `TENANT_SLUG` env só em dev/test (warn em produção se setado).
 */
export function resolveSlug(request: FastifyRequest): string | null {
  if (request.session?.tenantSlug) return request.session.tenantSlug;

  const header = request.headers['x-tenant-slug'];
  if (typeof header === 'string' && header.trim()) return header.trim();

  if (process.env.TENANT_SLUG) {
    if (process.env.NODE_ENV === 'production') {
      if (!warnedTenantSlugEnv) {
        request.log.warn(
          'TENANT_SLUG definido em produção — ignorado; use header X-Tenant-Slug ou sessão.',
        );
        warnedTenantSlugEnv = true;
      }
    } else {
      return process.env.TENANT_SLUG;
    }
  }

  const hostname = request.hostname || '';
  const parts = hostname.split('.');
  const isIp = /^\d+\.\d+\.\d+\.\d+$/.test(hostname);
  const hasSubdomain =
    !isIp && parts.length >= 2 && parts[0] !== 'www' && parts[0] !== 'localhost';

  if (hasSubdomain) return parts[0] ?? null;

  return null;
}

async function attachTenantToRequest(
  request: FastifyRequest,
  slug: string,
): Promise<void> {
  const { pool, tenant } = await getTenant(slug);
  request.tenantSlug = slug;
  request.tenantId = tenant.id;
  request.db = pool;
  request.drizzle = getCachedTenantDb(slug, pool);
}

/**
 * preHandler exclusivo de POST /auth/login — resolve tenant pelo body (slug ou
 * auto-resolve mono-loja), header dev ou TENANT_SLUG (só não-produção).
 * Sem tenantSlug no body, o handler da rota faz login cross-tenant (Merchant Hub).
 */
export async function loginTenantPreHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const body = (request.body ?? {}) as { email?: string; tenantSlug?: string };

  if (!body.tenantSlug?.trim()) {
    return;
  }

  const header =
    typeof request.headers['x-tenant-slug'] === 'string'
      ? request.headers['x-tenant-slug'].trim()
      : null;

  const resolved = await resolveLoginTenant(body.email ?? '', body.tenantSlug, header);
  if (!resolved.ok) {
    await reply
      .code(resolved.status)
      .send({ error: resolved.error, code: resolved.code });
    return;
  }

  try {
    await attachTenantToRequest(request, resolved.slug);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      request.log.warn({ err, slug: resolved.slug }, 'Falha ao resolver tenant no login');
    }
    await reply
      .code(404)
      .send({ error: 'Loja não encontrada.', code: 'TENANT_NOT_FOUND' });
  }
}

/**
 * preHandler "soft" para rotas tenant-opcionais (`/auth/me`, `/auth/logout`).
 * Anexa o tenant quando a sessão tem `tenantSlug`, mas nunca responde 404 —
 * sessões `platform_admin` não têm tenant.
 */
export async function softTenantPreHandler(request: FastifyRequest): Promise<void> {
  const slug = request.session?.tenantSlug;
  if (!slug) return;
  try {
    await attachTenantToRequest(request, slug);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      request.log.warn({ err, slug }, 'Soft tenant: falha ao resolver tenant da sessão');
    }
  }
}

/**
 * preHandler que resolve o tenant e injeta `request.tenantSlug`, `request.tenantId`
 * e `request.db` (pool). Responde `404 TENANT_NOT_FOUND` quando o tenant não é
 * identificado ou não existe.
 */
export async function tenantPreHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const slug = resolveSlug(request);

  if (!slug) {
    if (request.session?.role === 'admin' && request.session?.email) {
      await reply.code(403).send({
        error: 'Selecione uma loja para continuar.',
        code: 'TENANT_NOT_SELECTED',
      });
      return;
    }
    await reply
      .code(404)
      .send({ error: 'Tenant não identificado.', code: 'TENANT_NOT_FOUND' });
    return;
  }

  try {
    await attachTenantToRequest(request, slug);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      request.log.warn({ err, slug }, 'Falha ao resolver tenant');
    }
    await reply
      .code(404)
      .send({ error: 'Loja não encontrada.', code: 'TENANT_NOT_FOUND' });
  }
}
