const { Pool } = require('pg');

// SSL como hoje: ligado em produção ou quando há DATABASE_URL (Render).
// Permite desligar explicitamente em dev/Docker (Postgres sem SSL) via PGSSL=disable.
const sslEnabled =
  (process.env.NODE_ENV === 'production' || !!process.env.DATABASE_URL) &&
  process.env.PGSSL !== 'disable';

const masterPool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:123456@localhost:5432/lojao',
  ssl: sslEnabled ? { rejectUnauthorized: false } : false,
});

module.exports = masterPool;
