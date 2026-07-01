import type { PlatformTenant } from '@lojao/types/platform';

import { masterPool } from '../../lib/master-db.js';

export interface TenantRow {
  id: number;
  slug: string;
  nome: string;
  plano: string | null;
  ativo: boolean;
  created_at: Date | null;
}

const SELECT_COLS = 'id, slug, nome, plano, ativo, created_at';

export function toPlatformTenant(row: TenantRow): PlatformTenant {
  return {
    id: row.id,
    slug: row.slug,
    nome: row.nome,
    plano: row.plano,
    ativo: row.ativo,
    createdAt: row.created_at ? row.created_at.toISOString() : null,
  };
}

export async function findAllTenants(): Promise<TenantRow[]> {
  const result = await masterPool.query<TenantRow>(
    `SELECT ${SELECT_COLS} FROM tenants ORDER BY created_at DESC NULLS LAST, id DESC`,
  );
  return result.rows;
}

export async function findTenantBySlug(slug: string): Promise<TenantRow | null> {
  const result = await masterPool.query<TenantRow>(
    `SELECT ${SELECT_COLS} FROM tenants WHERE slug = $1`,
    [slug],
  );
  return result.rows[0] ?? null;
}

export async function findTenantIdBySlug(slug: string): Promise<number | null> {
  const existing = await masterPool.query('SELECT id FROM tenants WHERE slug = $1', [slug]);
  return existing.rows[0]?.id ?? null;
}

export async function insertTenant(params: {
  slug: string;
  nome: string;
  host: string;
  port: number;
  dbName: string;
  user: string;
  password: string;
  plano: string;
}): Promise<TenantRow> {
  const inserted = await masterPool.query<TenantRow>(
    `INSERT INTO tenants (slug, nome, db_host, db_port, db_name, db_user, db_password, plano, ativo)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
     RETURNING ${SELECT_COLS}`,
    [
      params.slug,
      params.nome,
      params.host,
      params.port,
      params.dbName,
      params.user,
      params.password,
      params.plano,
    ],
  );
  return inserted.rows[0]!;
}

export async function updateTenantBySlug(
  slug: string,
  patch: { nome?: string; ativo?: boolean; plano?: string },
): Promise<TenantRow | null> {
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

  values.push(slug);
  const result = await masterPool.query<TenantRow>(
    `UPDATE tenants SET ${sets.join(', ')} WHERE slug = $${i} RETURNING ${SELECT_COLS}`,
    values,
  );

  return result.rows[0] ?? null;
}
