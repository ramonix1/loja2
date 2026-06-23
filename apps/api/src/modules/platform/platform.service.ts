import { runMigrations } from '@lojao/db';
import type { PlatformTenant } from '@lojao/types/platform';

import { masterPool } from '../../lib/master-db.js';
import { invalidatePool } from '../../lib/tenant-db.js';

interface TenantRow {
  id: number;
  slug: string;
  nome: string;
  plano: string | null;
  ativo: boolean;
  created_at: Date | null;
}

function toPlatformTenant(row: TenantRow): PlatformTenant {
  return {
    id: row.id,
    slug: row.slug,
    nome: row.nome,
    plano: row.plano,
    ativo: row.ativo,
    createdAt: row.created_at ? row.created_at.toISOString() : null,
  };
}

const SELECT_COLS = 'id, slug, nome, plano, ativo, created_at';

export async function listTenants(): Promise<PlatformTenant[]> {
  const result = await masterPool.query<TenantRow>(
    `SELECT ${SELECT_COLS} FROM tenants ORDER BY created_at DESC NULLS LAST, id DESC`,
  );
  return result.rows.map(toPlatformTenant);
}

export async function getTenantBySlug(slug: string): Promise<PlatformTenant | null> {
  const result = await masterPool.query<TenantRow>(
    `SELECT ${SELECT_COLS} FROM tenants WHERE slug = $1`,
    [slug],
  );
  const row = result.rows[0];
  return row ? toPlatformTenant(row) : null;
}

export type CreateTenantResult =
  | { ok: true; tenant: PlatformTenant }
  | { ok: false; code: 'SLUG_EXISTS' };

/**
 * Cria um tenant no master e provisiona o schema (migrations idempotentes).
 *
 * MVP: a conexão do novo tenant aponta para o mesmo banco da plataforma
 * (`DATABASE_URL`). Em produção com bancos separados, troque os dados de
 * conexão e o provisionamento roda as migrations no banco de destino.
 */
export async function createTenant(input: {
  slug: string;
  nome: string;
  plano?: string;
}): Promise<CreateTenantResult> {
  const existing = await masterPool.query('SELECT id FROM tenants WHERE slug = $1', [input.slug]);
  if (existing.rows.length > 0) {
    return { ok: false, code: 'SLUG_EXISTS' };
  }

  const dbUrl = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/lojao';
  const url = new URL(dbUrl);
  const host = url.hostname;
  const port = Number.parseInt(url.port, 10) || 5432;
  const dbName = url.pathname.replace(/^\//, '');
  const user = url.username;
  const password = decodeURIComponent(url.password);

  const inserted = await masterPool.query<TenantRow>(
    `INSERT INTO tenants (slug, nome, db_host, db_port, db_name, db_user, db_password, plano, ativo)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
     RETURNING ${SELECT_COLS}`,
    [input.slug, input.nome, host, port, dbName, user, password, input.plano ?? 'basic'],
  );

  // Provisiona o schema do tenant. Em dev/test o tenant compartilha o banco da
  // plataforma (já migrado — ver `tenant-db.ts` singleDbUrl), então só rodamos
  // migrations em produção, onde cada tenant pode ter banco próprio.
  if (process.env.NODE_ENV === 'production') {
    await runMigrations(dbUrl);
  }

  return { ok: true, tenant: toPlatformTenant(inserted.rows[0]!) };
}

export type UpdateTenantResult =
  | { ok: true; tenant: PlatformTenant }
  | { ok: false; code: 'NOT_FOUND' };

/** Atualização soft: renomear, trocar plano, suspender/reativar (sem hard delete). */
export async function updateTenant(
  slug: string,
  patch: { nome?: string; ativo?: boolean; plano?: string },
): Promise<UpdateTenantResult> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (patch.nome !== undefined) {
    sets.push(`nome = $${i++}`);
    values.push(patch.nome);
  }
  if (patch.ativo !== undefined) {
    sets.push(`ativo = $${i++}`);
    values.push(patch.ativo);
  }
  if (patch.plano !== undefined) {
    sets.push(`plano = $${i++}`);
    values.push(patch.plano);
  }

  if (sets.length === 0) {
    const current = await getTenantBySlug(slug);
    return current ? { ok: true, tenant: current } : { ok: false, code: 'NOT_FOUND' };
  }

  values.push(slug);
  const result = await masterPool.query<TenantRow>(
    `UPDATE tenants SET ${sets.join(', ')} WHERE slug = $${i} RETURNING ${SELECT_COLS}`,
    values,
  );

  const row = result.rows[0];
  if (!row) return { ok: false, code: 'NOT_FOUND' };

  // Invalida cache de pool/meta para refletir mudanças (ex.: suspensão) de imediato.
  await invalidatePool(slug);

  return { ok: true, tenant: toPlatformTenant(row) };
}
