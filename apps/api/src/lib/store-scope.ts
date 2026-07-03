import type { FastifyRequest } from 'fastify';
import type pg from 'pg';

import type { MerchantDatabase } from '@lojao/db';

/**
 * MA8 — contexto de loja resolvido pelo plugin `store` para queries no
 * merchant DB (`atacommerce_*`). Todo serviço de negócio recebe este escopo
 * em vez de `request.db` tenant legado.
 */
export interface StoreScope {
  pool: pg.Pool;
  storeId: number;
  storeSlug: string;
  merchantId: number;
  merchantSlug: string;
  merchantDb: MerchantDatabase;
}

/** Extrai o escopo da loja ativa; lança se o plugin `store` não rodou. */
export function requireStoreScope(request: FastifyRequest): StoreScope {
  const storeId = request.storeId;
  const pool = request.db;
  const merchantDb = request.merchantDb;
  if (!storeId || !pool || !merchantDb || !request.merchantId || !request.merchantSlug || !request.storeSlug) {
    throw new Error('StoreScope ausente — plugin store não executou');
  }
  return {
    pool,
    storeId,
    storeSlug: request.storeSlug,
    merchantId: request.merchantId,
    merchantSlug: request.merchantSlug,
    merchantDb,
  };
}
