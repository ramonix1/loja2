import { getTenant } from './tenant-db.js';
import { masterPool } from './master-db.js';

export type LoginTenantResolution =
  | { ok: true; slug: string; tenantId: number; nome: string }
  | { ok: false; status: 400 | 404; code: string; error: string };

export interface AdminTenantMatch {
  slug: string;
  nome: string;
}

/**
 * Lista lojas ativas onde o e-mail possui usuário admin ativo.
 * Usado pelo Merchant Hub (login sem slug) e GET /auth/my-stores.
 */
export async function findAdminTenantsWithEmail(email: string): Promise<AdminTenantMatch[]> {
  const result = await masterPool.query<{ slug: string; nome: string }>(
    'SELECT slug, nome FROM tenants WHERE ativo = true ORDER BY slug',
  );

  const normalizedEmail = email.trim().toLowerCase();
  const matches: AdminTenantMatch[] = [];

  for (const row of result.rows) {
    try {
      const { pool } = await getTenant(row.slug);
      const user = await pool.query(
        `SELECT id FROM usuarios
         WHERE LOWER(email) = $1 AND ativo = true AND role = 'admin'
         LIMIT 1`,
        [normalizedEmail],
      );
      if (user.rows.length > 0) {
        matches.push({ slug: row.slug, nome: row.nome });
      }
    } catch {
      // tenant inacessível — ignora
    }
  }

  return matches;
}

/**
 * Resolve o tenant para POST /auth/login quando `tenantSlug` é informado no body.
 * Prioridade: body.tenantSlug > auto-resolve mono-loja > header > TENANT_SLUG (só dev).
 */
export async function resolveLoginTenant(
  email: string,
  tenantSlug?: string,
  headerSlug?: string | null,
): Promise<LoginTenantResolution> {
  let slug = tenantSlug?.trim() || null;

  if (!slug && email.trim()) {
    const matches = await findAdminTenantsWithEmail(email);
    if (matches.length === 1) {
      slug = matches[0]!.slug;
    }
  }

  if (!slug && headerSlug) slug = headerSlug;

  if (!slug && process.env.NODE_ENV !== 'production' && process.env.TENANT_SLUG) {
    slug = process.env.TENANT_SLUG;
  }

  if (!slug) {
    return {
      ok: false,
      status: 400,
      code: 'TENANT_SLUG_REQUIRED',
      error: 'Informe o slug da loja.',
    };
  }

  try {
    const { tenant } = await getTenant(slug);
    return { ok: true, slug: tenant.slug, tenantId: tenant.id, nome: tenant.nome };
  } catch {
    return {
      ok: false,
      status: 404,
      code: 'TENANT_NOT_FOUND',
      error: 'Loja não encontrada.',
    };
  }
}
