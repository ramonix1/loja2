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
 * - 403 `FORBIDDEN` se o usuário não for admin.
 */
export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (!request.session?.usuarioId) {
    await reply.code(401).send({ error: 'Não autenticado.', code: 'UNAUTHORIZED' });
    return;
  }

  if (request.session.role !== 'admin') {
    await reply
      .code(403)
      .send({ error: 'Acesso restrito a administradores.', code: 'FORBIDDEN' });
  }
}
