import type { FastifyReply, FastifyRequest } from 'fastify';

import { getStoreById, getStoreBySlug, StoreNotFoundError, type StoreContext } from '../lib/merchant-db.js';

/**
 * MA4 — `resolveStore`: análogo ao `resolveSlug` (tenant) para o modelo
 * merchant/store. Duas rotas de resolução (spec §2.3):
 *
 * - **Vitrine** (`publicStorePreHandler`): `/store/{storeSlug}` — path param
 *   ou header dev `X-Store-Slug` (mesmo padrão de `X-Tenant-Slug` hoje).
 * - **Admin autenticado** (`storePreHandler`): `session.storeId` — a loja
 *   selecionada no Merchant Hub (MA5/MA6 populam a sessão; aqui só o
 *   primitivo de resolução).
 *
 * Nenhum destes preHandlers está registrado no hook `/api/v1` ainda —
 * substituir `tenantPreHandler` é MA5+ (ver assunções em
 * docs/specs/merchant-account-STATUS.md).
 */

/** Resolve o slug da loja para requisições de vitrine. Prioridade: path param `storeSlug` > header `X-Store-Slug`. */
export function resolveStoreSlug(request: FastifyRequest): string | null {
  const params = request.params as { storeSlug?: string } | undefined;
  if (params?.storeSlug?.trim()) return params.storeSlug.trim();

  const header = request.headers['x-store-slug'];
  if (typeof header === 'string' && header.trim()) return header.trim();

  return null;
}

function attachStoreToRequest(request: FastifyRequest, ctx: StoreContext): void {
  request.merchantId = ctx.merchant.id;
  request.merchantSlug = ctx.merchant.slug;
  request.storeId = ctx.store.id;
  request.storeSlug = ctx.store.slug;
  request.merchantDb = ctx.merchantDb;
  // MA8 — rotas legadas usam `request.db`; aponta para o pool do merchant.
  request.db = ctx.pool;
}

/**
 * preHandler de vitrine (storefront): resolve a loja ativa pelo slug e injeta
 * `request.merchantId`/`storeId`/`merchantDb`. `404 STORE_NOT_FOUND` se a
 * loja não for identificada, não existir ou estiver inativa (loja ou merchant).
 */
export async function publicStorePreHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const slug = resolveStoreSlug(request);
  if (!slug) {
    await reply.code(404).send({ error: 'Loja não identificada.', code: 'STORE_NOT_FOUND' });
    return;
  }

  try {
    attachStoreToRequest(request, await getStoreBySlug(slug));
  } catch (err) {
    if (!(err instanceof StoreNotFoundError) && process.env.NODE_ENV !== 'production') {
      request.log.warn({ err, slug }, 'Falha ao resolver loja pública');
    }
    await reply.code(404).send({ error: 'Loja não encontrada.', code: 'STORE_NOT_FOUND' });
  }
}

/**
 * preHandler admin autenticado: resolve a loja ativa a partir de
 * `session.storeId`. `403 STORE_NOT_SELECTED` se a conta (`memberId`) ainda
 * não escolheu loja; `404 STORE_NOT_FOUND` se a loja da sessão não existir
 * mais ou estiver inativa.
 */
export async function storePreHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const storeId = request.session?.storeId;

  if (!storeId) {
    if (request.session?.memberId) {
      await reply.code(403).send({
        error: 'Selecione uma loja para continuar.',
        code: 'STORE_NOT_SELECTED',
      });
      return;
    }
    await reply.code(404).send({ error: 'Loja não identificada.', code: 'STORE_NOT_FOUND' });
    return;
  }

  try {
    attachStoreToRequest(request, await getStoreById(storeId));
  } catch (err) {
    if (!(err instanceof StoreNotFoundError) && process.env.NODE_ENV !== 'production') {
      request.log.warn({ err, storeId }, 'Falha ao resolver loja da sessão');
    }
    await reply.code(404).send({ error: 'Loja não encontrada.', code: 'STORE_NOT_FOUND' });
  }
}

/**
 * Variante "soft": anexa a loja se `session.storeId` existir, mas nunca
 * responde erro — para rotas de introspecção (`/auth/me`) quando existirem
 * sessões de conta MA sem loja selecionada.
 */
export async function softStorePreHandler(request: FastifyRequest): Promise<void> {
  const storeId = request.session?.storeId;
  if (!storeId) return;

  try {
    attachStoreToRequest(request, await getStoreById(storeId));
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      request.log.warn({ err, storeId }, 'Soft store: falha ao resolver loja da sessão');
    }
  }
}
