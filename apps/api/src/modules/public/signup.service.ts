import crypto from 'node:crypto';

import {
  isReservedSlug,
  signupAnnualPrice,
  SIGNUP_PLANS,
  type SignupInput,
  type SignupPlanPublic,
  type SignupResult,
} from './signup.schema.js';

import { createTenant } from '../platform/platform.service.js';
import {
  insertTenantAdminBySlug,
  insertTenantBillingTrial,
  insertTenantConfigBySlug,
  tenantSlugExists,
} from './signup.repository.js';

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
  if (await tenantSlugExists(normalized)) {
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
    await insertTenantAdminBySlug(slug, input.admin);
    await insertTenantConfigBySlug(slug, input.loja.nome);
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
      const ends = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
      await insertTenantBillingTrial(created.tenant.id, input.planSlug, ends);
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
