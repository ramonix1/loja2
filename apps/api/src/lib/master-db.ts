import '../load-env.js';

import pg from 'pg';

const { Pool } = pg;

/**
 * Pool do banco MASTER (tabelas `tenants` e `sessao`), portado de
 * `apps/legacy/config/masterDb.js`.
 *
 * SSL: ligado em produção ou quando há `DATABASE_URL` (Render). Pode ser
 * desligado explicitamente em dev/Docker (Postgres sem SSL) via `PGSSL=disable`.
 */
const sslEnabled =
  (process.env.NODE_ENV === 'production' || !!process.env.DATABASE_URL) &&
  process.env.PGSSL !== 'disable';

export const masterPool = new Pool({
  connectionString:
    process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/lojao',
  ssl: sslEnabled ? { rejectUnauthorized: false } : false,
});
