import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import pg from 'pg';

import { runMerchantMigrations } from './client.js';

const monorepoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const rootEnv = join(monorepoRoot, '.env');
if (existsSync(rootEnv)) {
  process.loadEnvFile(rootEnv);
}

function merchantDbName(slug: string): string {
  const safeSlug = slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return `atacommerce_${safeSlug}`.slice(0, 63);
}

function merchantConnectionUrl(dbName: string, masterUrl: string): string {
  const url = new URL(masterUrl);
  url.pathname = `/${dbName}`;
  return url.toString();
}

const masterUrl = process.env.DATABASE_URL;
if (!masterUrl) {
  throw new Error('DATABASE_URL não definida');
}

const pool = new pg.Pool({ connectionString: masterUrl, ssl: false });
try {
  const merchants = await pool.query<{ slug: string }>('SELECT slug FROM merchants ORDER BY slug');
  if (merchants.rows.length === 0) {
    console.log('[@lojao/db] Nenhum merchant — nada a migrar.');
  }

  for (const row of merchants.rows) {
    const dbName = merchantDbName(row.slug);
    const exists = await pool.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (!exists.rows[0]) {
      console.warn(`[@lojao/db] Banco ${dbName} ausente — pulando.`);
      continue;
    }
    console.log(`[@lojao/db] Migrando ${dbName}...`);
    await runMerchantMigrations(merchantConnectionUrl(dbName, masterUrl));
  }

  console.log('[@lojao/db] Migrations merchant concluídas.');
} finally {
  await pool.end();
}
