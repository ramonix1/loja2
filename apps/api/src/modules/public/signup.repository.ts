import { DEFAULT_LOJA_COR_PRIMARIA } from '@lojao/types/aparencia';
import { SIGNUP_PLANS, type SignupInput } from '@lojao/types/signup';
import argon2 from 'argon2';
import type pg from 'pg';

import { masterPool } from '../../lib/master-db.js';
import { getTenant } from '../../lib/tenant-db.js';

export async function tenantSlugExists(slug: string): Promise<boolean> {
  const existing = await masterPool.query('SELECT 1 FROM tenants WHERE slug = $1', [slug]);
  return existing.rows.length > 0;
}

export async function ensureBillingPlan(planSlug: 'starter' | 'professional'): Promise<string> {
  const plan = SIGNUP_PLANS.find((p) => p.slug === planSlug)!;
  await masterPool.query(
    `INSERT INTO billing_plans (name, slug, billing_type, price)
     VALUES ($1, $2, 'fixed', $3)
     ON CONFLICT (slug) DO NOTHING`,
    [plan.name, plan.slug, plan.priceMonthly],
  );
  const res = await masterPool.query<{ id: string }>(
    'SELECT id FROM billing_plans WHERE slug = $1',
    [plan.slug],
  );
  return res.rows[0]!.id;
}

export async function insertTenantBillingTrial(
  tenantId: number,
  planSlug: 'starter' | 'professional',
  trialEndsAt: Date,
): Promise<void> {
  const planId = await ensureBillingPlan(planSlug);
  const plan = SIGNUP_PLANS.find((p) => p.slug === planSlug)!;

  await masterPool.query(
    `INSERT INTO tenant_billing
       (tenant_id, plan_id, billing_type, monthly_fee, trial_ends_at, next_billing_date, status)
     VALUES ($1, $2, 'fixed', $3, $4, $4, 'trialing')
     ON CONFLICT (tenant_id) DO UPDATE SET
       plan_id = $2, billing_type = 'fixed', monthly_fee = $3,
       trial_ends_at = $4, next_billing_date = $4, status = 'trialing', updated_at = NOW()`,
    [tenantId, planId, plan.priceMonthly, trialEndsAt],
  );
}

export async function insertTenantAdmin(
  pool: pg.Pool,
  admin: SignupInput['admin'],
): Promise<void> {
  const senhaHash = await argon2.hash(admin.senha, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
  await pool.query(
    `INSERT INTO usuarios (nome, email, senha_hash, role, ativo)
     VALUES ($1, $2, $3, 'admin', true)
     ON CONFLICT (email) DO NOTHING`,
    [admin.nome, admin.email, senhaHash],
  );
}

export async function insertTenantAdminBySlug(
  slug: string,
  admin: SignupInput['admin'],
): Promise<void> {
  const { pool } = await getTenant(slug);
  await insertTenantAdmin(pool, admin);
}

export async function insertTenantConfig(pool: pg.Pool, lojaNome: string): Promise<void> {
  // Em dev/test os tenants compartilham o banco (configuracoes tem `chave` como
  // PK única) — ON CONFLICT DO NOTHING evita sobrescrever a config existente.
  // Em produção cada tenant tem banco próprio e a config é semeada do zero.
  await pool.query(
    `INSERT INTO configuracoes (chave, valor) VALUES
       ('loja_nome', $1),
       ('loja_cor_primaria', $2),
       ('loja_tema', 'escuro'),
       ('loja_slogan', '')
     ON CONFLICT (chave) DO NOTHING`,
    [lojaNome, DEFAULT_LOJA_COR_PRIMARIA],
  );
}

export async function insertTenantConfigBySlug(slug: string, lojaNome: string): Promise<void> {
  const { pool } = await getTenant(slug);
  await insertTenantConfig(pool, lojaNome);
}
