import { runMigrations } from '@lojao/db';
import type { PlatformTenant } from '@lojao/types/platform';

import { invalidatePool } from '../../lib/tenant-db.js';
import {
  findAllTenants,
  findTenantBySlug,
  findTenantIdBySlug,
  insertTenant,
  toPlatformTenant,
  updateTenantBySlug,
} from './platform.repository.js';

export async function listTenants(): Promise<PlatformTenant[]> {
  const rows = await findAllTenants();
  return rows.map(toPlatformTenant);
}

export async function getTenantBySlug(slug: string): Promise<PlatformTenant | null> {
  const row = await findTenantBySlug(slug);
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
  const existingId = await findTenantIdBySlug(input.slug);
  if (existingId !== null) {
    return { ok: false, code: 'SLUG_EXISTS' };
  }

  const dbUrl = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/lojao';
  const url = new URL(dbUrl);
  const host = url.hostname;
  const port = Number.parseInt(url.port, 10) || 5432;
  const dbName = url.pathname.replace(/^\//, '');
  const user = url.username;
  const password = decodeURIComponent(url.password);

  const row = await insertTenant({
    slug: input.slug,
    nome: input.nome,
    host,
    port,
    dbName,
    user,
    password,
    plano: input.plano ?? 'basic',
  });

  if (process.env.NODE_ENV === 'production') {
    await runMigrations(dbUrl);
  }

  return { ok: true, tenant: toPlatformTenant(row) };
}

export type UpdateTenantResult =
  | { ok: true; tenant: PlatformTenant }
  | { ok: false; code: 'NOT_FOUND' };

/** Atualização soft: renomear, trocar plano, suspender/reativar (sem hard delete). */
export async function updateTenant(
  slug: string,
  patch: { nome?: string; ativo?: boolean; plano?: string },
): Promise<UpdateTenantResult> {
  const hasChanges =
    patch.nome !== undefined || patch.ativo !== undefined || patch.plano !== undefined;

  if (!hasChanges) {
    const current = await getTenantBySlug(slug);
    return current ? { ok: true, tenant: current } : { ok: false, code: 'NOT_FOUND' };
  }

  const row = await updateTenantBySlug(slug, patch);
  if (!row) return { ok: false, code: 'NOT_FOUND' };

  await invalidatePool(slug);

  return { ok: true, tenant: toPlatformTenant(row) };
}
