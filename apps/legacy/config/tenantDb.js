const { Pool } = require('pg');
const masterDb = require('./masterDb');

const poolCache = {};

async function getPool(slug) {
  if (poolCache[slug]) return poolCache[slug];

  const r = await masterDb.query(
    'SELECT * FROM tenants WHERE slug = $1 AND ativo = true',
    [slug]
  );
  if (!r.rows[0]) throw new Error(`Tenant não encontrado: ${slug}`);

  const t = r.rows[0];
  const isProduction = process.env.NODE_ENV === 'production';

  poolCache[slug] = new Pool({
    host:     t.db_host,
    port:     t.db_port || 5432,
    database: t.db_name,
    user:     t.db_user,
    password: t.db_password,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
  });

  return poolCache[slug];
}

function invalidatePool(slug) {
  if (poolCache[slug]) {
    poolCache[slug].end();
    delete poolCache[slug];
  }
}

module.exports = { getPool, invalidatePool };
