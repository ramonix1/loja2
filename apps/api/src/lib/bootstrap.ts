import pg from 'pg';
import { runMigrations } from '@lojao/db';

import { signupMerchantAccount } from '../modules/merchants/merchant-signup.service.js';

const sslEnabled =
  (process.env.NODE_ENV === 'production' || !!process.env.DATABASE_URL) &&
  process.env.PGSSL !== 'disable';

function pgSsl(): boolean | { rejectUnauthorized: false } {
  return sslEnabled ? { rejectUnauthorized: false } : false;
}

/**
 * MA8 — Bootstrap greenfield: migrations Drizzle + merchant demo opcional.
 * Platform admin usa `MASTER_EMAIL`/`MASTER_PASSWORD` (env), sem tabela `usuarios`.
 */
export async function bootstrapDatabase(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.warn('[bootstrap] DATABASE_URL ausente — pulando migrations e provision.');
    return;
  }

  console.log('[bootstrap] Aplicando migrations Drizzle (greenfield MA)...');
  await runMigrations(dbUrl);
  await seedDemoMerchantIfConfigured();
}

async function seedDemoMerchantIfConfigured(): Promise<void> {
  const demoSlug = process.env.BOOTSTRAP_MERCHANT_SLUG?.trim();
  if (!demoSlug) return;

  const dbUrl = process.env.DATABASE_URL!;
  const pool = new pg.Pool({ connectionString: dbUrl, ssl: pgSsl() });
  try {
    const exists = await pool.query('SELECT id FROM merchants WHERE slug = $1', [demoSlug]);
    if (exists.rows.length > 0) {
      console.log(`[bootstrap] Merchant demo "${demoSlug}" já existe — pulando seed.`);
      return;
    }
  } finally {
    await pool.end();
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@loja.com';
  const adminSenha = process.env.ADMIN_SENHA ?? 'admin123';
  const adminNome = process.env.ADMIN_NOME ?? 'Administrador';
  const storeSlug = process.env.BOOTSTRAP_STORE_SLUG?.trim() ?? demoSlug;

  console.log(`[bootstrap] Criando merchant demo "${demoSlug}" + loja "${storeSlug}"...`);
  const result = await signupMerchantAccount({
    merchant: { slug: demoSlug, name: process.env.BOOTSTRAP_MERCHANT_NAME ?? 'Ata Commerce Demo' },
    owner: { name: adminNome, email: adminEmail, senha: adminSenha },
    store: { slug: storeSlug, name: process.env.BOOTSTRAP_STORE_NAME ?? 'Loja Demo' },
    planSlug: 'starter',
  });

  if (!result.ok) {
    console.warn(`[bootstrap] Falha ao criar merchant demo: ${result.code}`);
    return;
  }

  console.log(
    `[bootstrap] Merchant demo criado (merchant=${result.result.merchantSlug}, store=${result.result.storeSlug}).`,
  );
}
