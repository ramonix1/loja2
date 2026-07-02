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
 * preHandler que exige sessão autenticada com papel de operador da loja (MA8).
 * Conta merchant: `memberId` + loja selecionada (`storeId`); roles owner/admin/operator.
 */
export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (!request.session?.memberId) {
    await reply.code(401).send({ error: 'Não autenticado.', code: 'UNAUTHORIZED' });
    return;
  }

  const role = request.session.role;
  if (!role || !['owner', 'admin', 'operator'].includes(role)) {
    await reply
      .code(403)
      .send({ error: 'Acesso restrito a administradores.', code: 'FORBIDDEN' });
    return;
  }

  if (!request.session.storeId) {
    await reply.code(403).send({
      error: 'Selecione uma loja para continuar.',
      code: 'STORE_NOT_SELECTED',
    });
  }
}

/**
 * preHandler para rotas Merchant Hub (`/auth/my-stores`). MA8 — só conta merchant.
 */
export async function requireMerchantAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (!request.session?.memberId) {
    await reply.code(401).send({ error: 'Não autenticado.', code: 'UNAUTHORIZED' });
  }
}

/**
 * preHandler MA5 — exige conta merchant autenticada (`session.memberId`),
 * independente de já ter loja selecionada. Usado por `POST /auth/select-store`
 * (a própria rota que define `session.storeId`).
 *
 * - 401 `UNAUTHORIZED` se não houver `session.memberId`.
 */
export async function requireMerchantMember(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (!request.session?.memberId) {
    await reply.code(401).send({ error: 'Não autenticado.', code: 'UNAUTHORIZED' });
  }
}

/**
 * preHandler MA8 — `GET /auth/my-stores` exige conta merchant (`memberId`).
 */
export async function requireAccountSession(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (!request.session?.memberId) {
    await reply.code(401).send({ error: 'Não autenticado.', code: 'UNAUTHORIZED' });
  }
}

/**
 * preHandler MA4 — exige conta merchant autenticada (`session.memberId`) e
 * loja selecionada (`session.storeId`). Primitivo para as rotas store-aware
 * análogo a `requireAdmin` no modelo legado removido (MA9).
 *
 * - 401 `UNAUTHORIZED` se não houver `session.memberId`.
 * - 403 `STORE_NOT_SELECTED` se a conta existir mas sem loja escolhida.
 */
export async function requireStoreSelected(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (!request.session?.memberId) {
    await reply.code(401).send({ error: 'Não autenticado.', code: 'UNAUTHORIZED' });
    return;
  }

  if (!request.session.storeId) {
    await reply.code(403).send({
      error: 'Selecione uma loja para continuar.',
      code: 'STORE_NOT_SELECTED',
    });
  }
}

/**
 * preHandler MA6 — exige conta merchant autenticada com `role === 'owner'`.
 * Usado por `POST /merchants/:merchantId/stores` (criar loja adicional): ação
 * de nível de conta (impacta `max_stores`/billing), restrita ao owner —
 * `admin`/`operator` não gerenciam lojas da conta. Decisão conservadora
 * documentada em `merchant-account-STATUS.md` (assunções MA6).
 *
 * - 401 `UNAUTHORIZED` se não houver `session.memberId`.
 * - 403 `FORBIDDEN` se a conta existir mas o papel não for `owner`.
 */
export async function requireMerchantOwner(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (!request.session?.memberId) {
    await reply.code(401).send({ error: 'Não autenticado.', code: 'UNAUTHORIZED' });
    return;
  }

  if (request.session.role !== 'owner') {
    await reply
      .code(403)
      .send({ error: 'Ação restrita ao proprietário da conta.', code: 'FORBIDDEN' });
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
