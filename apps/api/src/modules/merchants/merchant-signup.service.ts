import { createMasterDb, createMerchantDb, eq, merchantMembers, merchants, stores } from '@lojao/db';
import { storeSettings } from '@lojao/db/schema/merchant';
import { DEFAULT_LOJA_COR_PRIMARIA } from '@lojao/types/aparencia';
import {
  MERCHANT_PLAN_MAX_STORES,
  type MerchantSignupInput,
  type MerchantSignupResult,
} from '@lojao/types/merchant';
import { isReservedSlug } from '@lojao/types/signup';
import argon2 from 'argon2';
import pg from 'pg';

import { masterPool } from '../../lib/master-db.js';
import { merchantDbName, merchantPoolConfig } from '../../lib/merchant-provision.js';
import { createMerchant, createStoreForMerchant } from './merchant.service.js';
import { registerMerchantTrialBilling } from '../../services/merchant-billing.service.js';

const TRIAL_DAYS = 14;

const { Pool } = pg;
const masterDb = createMasterDb(masterPool);

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
} as const;

/**
 * MA6 — cadastro self-service do modelo **merchant account** (spec §2.5
 * "Signup self-service"): cria `merchants` + provisiona o banco físico
 * (`createMerchant`, MA3), o `merchant_member` **owner** e a **loja #1**
 * (`createStoreForMerchant`, com `max_stores` do plano já aplicado).
 *
 * **Não substitui** `POST /public/signup` (modelo tenant legado) — esse
 * continua sendo o único caminho de onboarding em produção até o cutover
 * greenfield (MA8). Esta função é o primitivo MA6, exposto em
 * `POST /public/merchant-signup`, sem wiring na UI de marketing ainda (mesmo
 * padrão de primitivo-antes-da-UI das fases MA3–MA5). Ver assunções em
 * `docs/specs/merchant-account-STATUS.md`.
 *
 * **Billing/trial** (`merchant_billing`) registrado em MA7 — trial 14d best-effort
 * após provisionamento da conta (mesmo padrão de `provisionSignup` legado).
 */
/** Dados internos para popular a sessão após signup (não expostos na resposta pública). */
export type MerchantSignupSession = {
  member: {
    id: number;
    merchantId: number;
    merchantSlug: string;
    name: string;
    email: string;
    role: 'owner';
  };
  store: { id: number; slug: string };
};

export type MerchantSignupOutcome =
  | { ok: true; result: MerchantSignupResult; session: MerchantSignupSession }
  | {
      ok: false;
      code:
        | 'ENTERPRISE_CONTACT'
        | 'MERCHANT_SLUG_EXISTS'
        | 'STORE_SLUG_RESERVED'
        | 'STORE_SLUG_EXISTS'
        | 'PROVISION_ERROR';
      message: string;
    };

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
    process.env.ADMIN_PUBLIC_URL ?? process.env.ADMIN_URL ?? 'https://app.atalabs.com.br'
  ).replace(/\/$/, '');
}

/** Disponibilidade do slug do **merchant** (conta) — único em `merchants.slug`. */
export async function checkMerchantSlugAvailability(
  slug: string,
): Promise<{ available: boolean }> {
  const normalized = slug.trim().toLowerCase();
  const existing = await masterDb
    .select({ id: merchants.id })
    .from(merchants)
    .where(eq(merchants.slug, normalized));
  return { available: existing.length === 0 };
}

/** Disponibilidade do slug da **loja** (vitrine) — reservado ou já usado globalmente em `stores.slug`. */
export async function checkStoreSlugAvailability(
  slug: string,
): Promise<{ available: true } | { available: false; reason: 'RESERVED' | 'TAKEN' }> {
  const normalized = slug.trim().toLowerCase();
  if (isReservedSlug(normalized)) {
    return { available: false, reason: 'RESERVED' };
  }
  const existing = await masterDb
    .select({ id: stores.id })
    .from(stores)
    .where(eq(stores.slug, normalized));
  if (existing.length > 0) {
    return { available: false, reason: 'TAKEN' };
  }
  return { available: true };
}

/**
 * Seed mínimo de `store_settings` na loja recém-criada (mesmas chaves default
 * de `seedTenantConfig`, traduzidas para o schema EN — db-schema-english.md §4.1).
 * Conexão pontual (não usa o pool cacheado de `merchant-db.ts`) — fecha ao final.
 */
async function seedStoreConfig(merchantSlug: string, storeId: number, storeName: string): Promise<void> {
  const pool = new Pool(merchantPoolConfig(merchantDbName(merchantSlug)));
  try {
    const db = createMerchantDb(pool); // conexão pontual — não usa o pool cacheado de `merchant-db.ts`.
    await db
      .insert(storeSettings)
      .values([
        { storeId, key: 'store.display_name', value: storeName },
        { storeId, key: 'store.primary_color', value: DEFAULT_LOJA_COR_PRIMARIA },
        { storeId, key: 'store.tagline', value: '' },
      ])
      .onConflictDoNothing();
  } finally {
    await pool.end();
  }
}

async function createOwnerMember(
  merchantId: number,
  owner: MerchantSignupInput['owner'],
): Promise<number> {
  const passwordHash = await argon2.hash(owner.senha, ARGON2_OPTIONS);
  const email = owner.email.trim().toLowerCase();
  const [row] = await masterDb
    .insert(merchantMembers)
    .values({
      merchantId,
      email,
      name: owner.name.trim(),
      passwordHash,
      role: 'owner',
    })
    .returning({ id: merchantMembers.id });
  if (!row) throw new Error('Falha ao criar owner member.');
  return row.id;
}

export async function signupMerchantAccount(
  input: MerchantSignupInput,
  opts: { log?: (msg: string) => void } = {},
): Promise<MerchantSignupOutcome> {
  const log = opts.log ?? (() => {});

  if (input.planSlug === 'enterprise') {
    return {
      ok: false,
      code: 'ENTERPRISE_CONTACT',
      message: 'Plano Enterprise requer contato com o time comercial.',
    };
  }

  const storeSlug = input.store.slug.trim().toLowerCase();
  const storeAvailability = await checkStoreSlugAvailability(storeSlug);
  if (!storeAvailability.available) {
    return storeAvailability.reason === 'RESERVED'
      ? { ok: false, code: 'STORE_SLUG_RESERVED', message: 'Este slug de loja é reservado. Escolha outro.' }
      : { ok: false, code: 'STORE_SLUG_EXISTS', message: 'Já existe uma loja com esse slug.' };
  }

  const maxStores = MERCHANT_PLAN_MAX_STORES[input.planSlug];
  const merchantResult = await createMerchant(
    { slug: input.merchant.slug, name: input.merchant.name },
    { maxStores },
  );
  if (!merchantResult.ok) {
    return { ok: false, code: 'MERCHANT_SLUG_EXISTS', message: 'Já existe uma conta com esse slug.' };
  }

  // A partir daqui o merchant (+ banco físico) já existe. As próximas etapas
  // são best-effort (mesmo padrão de `provisionSignup`/`createTenantAdmin` no
  // fluxo tenant legado): falha aqui não desfaz o merchant criado — fica
  // como conta sem owner/loja, recuperável manualmente (não há transação
  // cross-banco entre master e o banco físico do merchant).
  try {
    const ownerMemberId = await createOwnerMember(merchantResult.merchant.id, input.owner);

    const storeResult = await createStoreForMerchant(merchantResult.merchant.id, {
      slug: storeSlug,
      name: input.store.name,
    });
    if (!storeResult.ok) {
      log(`[merchant-signup] falha ao criar loja #1 para ${merchantResult.merchant.slug}: ${storeResult.code}`);
      return {
        ok: false,
        code: storeResult.code === 'SLUG_EXISTS' ? 'STORE_SLUG_EXISTS' : 'PROVISION_ERROR',
        message: 'Não foi possível concluir o cadastro.',
      };
    }

    try {
      await seedStoreConfig(merchantResult.merchant.slug, storeResult.store.id, storeResult.store.name);
    } catch (err) {
      // Config da loja é best-effort — não falha o signup (mesmo racional de `seedTenantConfig`).
      log(`[merchant-signup] aviso: falha ao semear store_settings de ${storeSlug}: ${String(err)}`);
    }

    let trialEndsAt: string | undefined;
    try {
      const ends = await registerMerchantTrialBilling(merchantResult.merchant.id, input.planSlug);
      trialEndsAt = ends.toISOString();
      log(
        `[merchant-signup] trial ${TRIAL_DAYS}d registrado para merchant=${merchantResult.merchant.slug} plano=${input.planSlug} fim=${trialEndsAt}`,
      );
    } catch (err) {
      // Trial é best-effort — não falha o signup se o billing tiver problema (mesmo padrão G.1).
      log(
        `[merchant-signup] aviso: falha ao registrar trial para ${merchantResult.merchant.slug}: ${String(err)}`,
      );
    }

    const result: MerchantSignupResult = {
      merchantSlug: merchantResult.merchant.slug,
      merchantName: merchantResult.merchant.name,
      storeSlug: storeResult.store.slug,
      storeName: storeResult.store.name,
      ownerEmail: input.owner.email.trim().toLowerCase(),
      storefrontUrl: `${storefrontBaseUrl()}/store/${storeResult.store.slug}`,
      adminUrl: `${adminBaseUrl()}/admin/dashboard`,
      ...(trialEndsAt ? { trialEndsAt } : {}),
    };

    return {
      ok: true,
      result,
      session: {
        member: {
          id: ownerMemberId,
          merchantId: merchantResult.merchant.id,
          merchantSlug: merchantResult.merchant.slug,
          name: input.owner.name.trim(),
          email: input.owner.email.trim().toLowerCase(),
          role: 'owner',
        },
        store: { id: storeResult.store.id, slug: storeResult.store.slug },
      },
    };
  } catch (err) {
    log(`[merchant-signup] erro ao provisionar conta ${merchantResult.merchant.slug}: ${String(err)}`);
    return { ok: false, code: 'PROVISION_ERROR', message: 'Não foi possível concluir o cadastro.' };
  }
}
