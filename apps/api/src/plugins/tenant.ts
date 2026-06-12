import type { FastifyReply, FastifyRequest } from 'fastify';

import { getTenant } from '../lib/tenant-db.js';

/**
 * Resolve o slug do tenant a partir da requisição.
 * Prioridade: sessão > env `TENANT_SLUG` > header `X-Tenant-Slug` > subdomínio.
 * Portado de `apps/legacy/middlewares/tenant.js`.
 */
export function resolveSlug(request: FastifyRequest): string | null {
  if (request.session?.tenantSlug) return request.session.tenantSlug;

  if (process.env.TENANT_SLUG) return process.env.TENANT_SLUG;

  const header = request.headers['x-tenant-slug'];
  if (typeof header === 'string' && header) return header;

  const hostname = request.hostname || '';
  const parts = hostname.split('.');
  const isIp = /^\d+\.\d+\.\d+\.\d+$/.test(hostname);
  const hasSubdomain =
    !isIp && parts.length >= 2 && parts[0] !== 'www' && parts[0] !== 'localhost';

  if (hasSubdomain) return parts[0] ?? null;

  return null;
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
    await reply
      .code(404)
      .send({ error: 'Tenant não identificado.', code: 'TENANT_NOT_FOUND' });
    return;
  }

  try {
    const { pool, tenant } = await getTenant(slug);
    request.tenantSlug = slug;
    request.tenantId = tenant.id;
    request.db = pool;
  } catch {
    await reply
      .code(404)
      .send({ error: 'Loja não encontrada.', code: 'TENANT_NOT_FOUND' });
  }
}
