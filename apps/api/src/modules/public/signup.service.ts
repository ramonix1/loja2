import crypto from 'node:crypto';

import {
  SIGNUP_PLANS,
  isReservedSlug,
  signupAnnualPrice,
  type SignupInput,
  type SignupPlanPublic,
  type SignupResult,
} from '@lojao/types/signup';
import { DEFAULT_LOJA_COR_PRIMARIA } from '@lojao/types/aparencia';
import argon2 from 'argon2';

import { masterPool } from '../../lib/master-db.js';
import { getTenant } from '../../lib/tenant-db.js';
import { createTenant } from '../platform/platform.service.js';

const TRIAL_DAYS = 14;

/** Disponibilidade do slug para signup público. */
export type SlugAvailability =
  | { available: true }
  | { available: false; reason: 'RESERVED' | 'TAKEN' };

export async function checkSlugAvailability(slug: string): Promise<SlugAvailability> {
  const normalized = slug.trim().toLowerCase();
  if (isReservedSlug(normalized)) {
    return { available: false, reason: 'RESERVED' };
  }
  const existing = await masterPool.query('SELECT 1 FROM tenants WHERE slug = $1', [normalized]);
  if (existing.rows.length > 0) {
    return { available: false, reason: 'TAKEN' };
  }
  return { available: true };
}

/** Planos públicos (mirror marketing) com preço anual calculado. */
export function listSignupPlans(): (SignupPlanPublic & { priceAnnual: number | null })[] {
  return SIGNUP_PLANS.map((plan) => ({
    ...plan,
    priceAnnual: plan.priceMonthly === null ? null : signupAnnualPrice(plan.priceMonthly),
  }));
}

export type SignupOutcome =
  | { ok: true; result: SignupResult }
  | { ok: false; code: 'ENTERPRISE_CONTACT' | 'SLUG_EXISTS' | 'SLUG_RESERVED' | 'PROVISION_ERROR'; message: string };

/**
 * Cache de idempotência em memória (processo). Chave = `Idempotency-Key` do
 * header ou hash(email+slug). MVP: evita provisionar duas vezes a mesma loja na
 * mesma instância. Em produção multi-instância, trocar por tabela/redis (G.2).
 */
const idempotencyCache = new Map<string, SignupResult>();

function idempotencyKeyFor(input: SignupInput, headerKey?: string | null): string {
  if (headerKey && headerKey.trim()) return `hdr:${headerKey.trim()}`;
  const hash = crypto
    .createHash('sha256')
    .update(`${input.admin.email}|${input.loja.slug}`)
    .digest('hex');
  return `hash:${hash}`;
}

function storefrontBaseUrl(): string {
  return (
    process.env.STOREFRONT_PUBLIC_URL ??
    process.env.STOREFRONT_URL ??
    process.env.PUBLIC_STOREFRONT_URL ??
    'https://atalabs.com.br'
  ).replace(/\/$/, '');
}

function adminBaseUrl(): string {
  return (
    process.env.ADMIN_PUBLIC_URL ??
    process.env.ADMIN_URL ??
    'https://app.atalabs.com.br'
  ).replace(/\/$/, '');
}

async function ensureBillingPlan(planSlug: 'starter' | 'professional'): Promise<string> {
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

async function registerTrialBilling(
  tenantId: number,
  planSlug: 'starter' | 'professional',
): Promise<Date> {
  const planId = await ensureBillingPlan(planSlug);
  const plan = SIGNUP_PLANS.find((p) => p.slug === planSlug)!;
  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  await masterPool.query(
    `INSERT INTO tenant_billing
       (tenant_id, plan_id, billing_type, monthly_fee, trial_ends_at, next_billing_date, status)
     VALUES ($1, $2, 'fixed', $3, $4, $4, 'trialing')
     ON CONFLICT (tenant_id) DO UPDATE SET
       plan_id = $2, billing_type = 'fixed', monthly_fee = $3,
       trial_ends_at = $4, next_billing_date = $4, status = 'trialing', updated_at = NOW()`,
    [tenantId, planId, plan.priceMonthly, trialEndsAt],
  );

  return trialEndsAt;
}

async function createTenantAdmin(slug: string, admin: SignupInput['admin']): Promise<void> {
  const { pool } = await getTenant(slug);
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

async function seedTenantConfig(slug: string, lojaNome: string): Promise<void> {
  const { pool } = await getTenant(slug);
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

/**
 * Provisiona uma loja self-service: tenant (master) + admin (tenant) + config
 * mínima + billing trial 14d. Reutiliza `createTenant` da Fase F.
 *
 * MVP G.1: cobrança real é stub (apenas log); trial sem cartão.
 */
export async function provisionSignup(
  input: SignupInput,
  opts: { idempotencyKey?: string | null; log?: (msg: string) => void } = {},
): Promise<SignupOutcome> {
  const log = opts.log ?? (() => {});

  if (input.planSlug === 'enterprise') {
    return {
      ok: false,
      code: 'ENTERPRISE_CONTACT',
      message: 'Plano Enterprise requer contato com o time comercial.',
    };
  }

  const cacheKey = idempotencyKeyFor(input, opts.idempotencyKey);
  const cached = idempotencyCache.get(cacheKey);
  if (cached) {
    return { ok: true, result: cached };
  }

  const slug = input.loja.slug.trim().toLowerCase();
  if (isReservedSlug(slug)) {
    return { ok: false, code: 'SLUG_RESERVED', message: 'Este slug é reservado. Escolha outro.' };
  }

  const created = await createTenant({ slug, nome: input.loja.nome, plano: input.planSlug });
  if (!created.ok) {
    return { ok: false, code: 'SLUG_EXISTS', message: 'Já existe uma loja com esse slug.' };
  }

  try {
    await createTenantAdmin(slug, input.admin);
    await seedTenantConfig(slug, input.loja.nome);
  } catch (err) {
    log(`[signup] erro ao provisionar admin/config para ${slug}: ${String(err)}`);
    return {
      ok: false,
      code: 'PROVISION_ERROR',
      message: 'Não foi possível concluir o provisionamento.',
    };
  }

  let trialEndsAt: string | undefined;
  if (input.trial) {
    try {
      const ends = await registerTrialBilling(created.tenant.id, input.planSlug);
      trialEndsAt = ends.toISOString();
      // Stub de cobrança real (G.2 fará gateway + webhook).
      log(
        `[signup] trial ${TRIAL_DAYS}d registrado para tenant=${slug} plano=${input.planSlug} fim=${trialEndsAt}`,
      );
    } catch (err) {
      // Trial é best-effort no MVP: não falha o signup se o billing tiver problema.
      log(`[signup] aviso: falha ao registrar trial para ${slug}: ${String(err)}`);
    }
  }

  const result: SignupResult = {
    tenantSlug: slug,
    lojaNome: input.loja.nome,
    adminEmail: input.admin.email,
    storefrontUrl: `${storefrontBaseUrl()}/store/${slug}`,
    adminUrl: `${adminBaseUrl()}/login`,
    ...(trialEndsAt ? { trialEndsAt } : {}),
  };

  idempotencyCache.set(cacheKey, result);
  return { ok: true, result };
}
