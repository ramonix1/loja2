import 'fastify';
import type pg from 'pg';
import type { MerchantDatabase } from '@lojao/db';

import type { Session } from '../plugins/session.js';

declare module 'fastify' {
  interface FastifyRequest {
    /** Sessão compartilhada (cookie `lojao.sid`). */
    session: Session;
    /** Pool do banco físico do merchant (`atacommerce_*`). */
    db: pg.Pool;
    /** Conta (merchant) resolvida pelo plugin `store`. */
    merchantId?: number;
    merchantSlug?: string;
    /** Loja ativa dentro do merchant. */
    storeId?: number;
    storeSlug?: string;
    /** Drizzle do merchant DB (schema EN + `store_id`). */
    merchantDb?: MerchantDatabase;
  }
}
