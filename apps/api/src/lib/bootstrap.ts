import argon2 from 'argon2';
import pg from 'pg';
import { runMigrations } from '@lojao/db';

const sslEnabled =
  (process.env.NODE_ENV === 'production' || !!process.env.DATABASE_URL) &&
  process.env.PGSSL !== 'disable';

function pgSsl(): boolean | { rejectUnauthorized: false } {
  return sslEnabled ? { rejectUnauthorized: false } : false;
}

/**
 * Bootstrap dev/prod: migrations Drizzle + auto-provision do tenant padrão.
 * Substitui `apps/legacy/config/init-db.js` (removido na Fase 8).
 */
export async function bootstrapDatabase(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.warn('[bootstrap] DATABASE_URL ausente — pulando migrations e provision.');
    return;
  }

  console.log('[bootstrap] Aplicando migrations Drizzle...');
  await runMigrations(dbUrl);
  await autoProvisionTenant(dbUrl);
}

async function autoProvisionTenant(dbUrl: string): Promise<void> {
  const slugs = new Set<string>(['demo']);
  const envSlug = process.env.TENANT_SLUG?.trim();
  if (envSlug) slugs.add(envSlug);

  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@loja.com';
  const adminSenha = process.env.ADMIN_SENHA ?? 'admin123';
  const adminNome = process.env.ADMIN_NOME ?? 'Administrador';

  const url = new URL(dbUrl);
  const host = url.hostname;
  const port = Number.parseInt(url.port, 10) || 5432;
  const dbName = url.pathname.replace(/^\//, '');
  const user = url.username;
  const password = decodeURIComponent(url.password);

  const pool = new pg.Pool({ connectionString: dbUrl, ssl: pgSsl() });

  try {
    for (const slug of slugs) {
      const nome = slug === 'demo' ? 'Ata Commerce Demo' : slug;
      const existe = await pool.query('SELECT id FROM tenants WHERE slug = $1', [slug]);

      if (existe.rows.length === 0) {
        await pool.query(
          `INSERT INTO tenants (slug, nome, db_host, db_port, db_name, db_user, db_password, ativo)
           VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
          [slug, nome, host, port, dbName, user, password],
        );
        console.log(`[bootstrap] Tenant "${slug}" registrado.`);
      } else {
        console.log(`[bootstrap] Tenant "${slug}" já existe (id=${existe.rows[0].id}).`);
      }
    }

    await ensureAdminUser(pool, adminEmail, adminSenha, adminNome);
    console.log(`[bootstrap] Admin verificado (${adminEmail}).`);
  } catch (err) {
    console.error('[bootstrap] Erro no auto-provision:', err);
    throw err;
  } finally {
    await pool.end();
  }
}

async function ensureAdminUser(
  pool: pg.Pool,
  email: string,
  senha: string,
  nome: string,
): Promise<void> {
  const existing = await pool.query(
    `SELECT id FROM usuarios WHERE email = $1 OR role = 'admin' LIMIT 1`,
    [email],
  );
  if (existing.rows.length > 0) return;

  const senhaHash = await argon2.hash(senha, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  await pool.query(
    `INSERT INTO usuarios (nome, email, senha_hash, role, ativo) VALUES ($1, $2, $3, 'admin', true)`,
    [nome, email, senhaHash],
  );
}
