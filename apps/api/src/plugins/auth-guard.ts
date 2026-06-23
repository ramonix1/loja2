import type { FastifyReply, FastifyRequest } from 'fastify';

/**
 * preHandler que exige sessão autenticada (qualquer role).
 */
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (!request.session?.usuarioId) {
    await reply.code(401).send({ error: 'Não autenticado.', code: 'UNAUTHORIZED' });
  }
}

/**
 * preHandler que exige sessão autenticada com `role === 'admin'`.
 * Aplicado às rotas `/api/v1/admin/*`.
 *
 * - 401 `UNAUTHORIZED` se não houver sessão.
 * - 403 `TENANT_NOT_SELECTED` se admin autenticado sem loja selecionada.
 * - 403 `FORBIDDEN` se o usuário não for admin.
 */
export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (!request.session?.usuarioId) {
    if (request.session?.role === 'admin' && request.session?.email) {
      await reply.code(403).send({
        error: 'Selecione uma loja para continuar.',
        code: 'TENANT_NOT_SELECTED',
      });
      return;
    }
    await reply.code(401).send({ error: 'Não autenticado.', code: 'UNAUTHORIZED' });
    return;
  }

  if (request.session.role !== 'admin') {
    await reply
      .code(403)
      .send({ error: 'Acesso restrito a administradores.', code: 'FORBIDDEN' });
    return;
  }

  if (!request.session.tenantSlug) {
    await reply.code(403).send({
      error: 'Selecione uma loja para continuar.',
      code: 'TENANT_NOT_SELECTED',
    });
  }
}

/**
 * preHandler para rotas Merchant Hub (`/auth/my-stores`, `/auth/select-tenant`).
 * Aceita sessão admin parcial (e-mail + role, sem tenantSlug).
 */
export async function requireMerchantAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (!request.session?.email || request.session.role !== 'admin') {
    await reply.code(401).send({ error: 'Não autenticado.', code: 'UNAUTHORIZED' });
  }
}

/**
 * preHandler que exige sessão com `role === 'platform_admin'` (operador Ata Labs).
 * Aplicado às rotas `/api/v1/platform/*` (exceto `/platform/login`).
 *
 * - 401 `UNAUTHORIZED` se não houver sessão.
 * - 403 `FORBIDDEN` se o usuário não for operador da plataforma.
 */
export async function requirePlatformAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (!request.session?.usuarioId) {
    await reply.code(401).send({ error: 'Não autenticado.', code: 'UNAUTHORIZED' });
    return;
  }

  if (request.session.role !== 'platform_admin') {
    await reply
      .code(403)
      .send({ error: 'Acesso restrito à plataforma.', code: 'FORBIDDEN' });
  }
}
