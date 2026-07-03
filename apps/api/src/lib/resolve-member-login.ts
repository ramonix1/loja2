import { and, createMasterDb, eq, merchantMembers, merchants, stores } from '@lojao/db';

import { masterPool } from './master-db.js';

/**
 * MA5 — resolução de login da conta merchant (`merchant_members`): consulta
 * O(1) no master (join `merchant_members` + `merchants`), sem conectar em
 * bancos físicos por loja. Ver docs/specs/merchant-account-architecture-spec.md §5.
 */

const masterDb = createMasterDb(masterPool);

export interface MemberMatch {
  memberId: number;
  name: string;
  email: string;
  role: string;
  passwordHash: string;
  failedAttempts: number;
  blockedUntil: Date | null;
  merchantId: number;
  merchantSlug: string;
  merchantName: string;
}

export interface StoreLite {
  id: number;
  slug: string;
  name: string;
}

/**
 * Busca membros ativos (de merchants ativos) com o e-mail informado — consulta
 * única no master. `merchant_members.email` só é único por conta
 * (`UNIQUE(merchant_id, email)`); em tese o mesmo e-mail pode existir em mais
 * de uma conta. MA5 não trata esse caso (sem signup self-service ainda —
 * MA6); assume-se 0 ou 1 resultado e, se houver mais de um, usa o primeiro
 * (ordenado por id) — decisão documentada em `merchant-account-STATUS.md`.
 */
export async function findActiveMembersByEmail(email: string): Promise<MemberMatch[]> {
  const normalizedEmail = email.trim().toLowerCase();
  const rows = await masterDb
    .select({
      memberId: merchantMembers.id,
      name: merchantMembers.name,
      email: merchantMembers.email,
      role: merchantMembers.role,
      passwordHash: merchantMembers.passwordHash,
      failedAttempts: merchantMembers.failedAttempts,
      blockedUntil: merchantMembers.blockedUntil,
      merchantId: merchants.id,
      merchantSlug: merchants.slug,
      merchantName: merchants.name,
    })
    .from(merchantMembers)
    .innerJoin(merchants, eq(merchants.id, merchantMembers.merchantId))
    .where(
      and(
        eq(merchantMembers.email, normalizedEmail),
        eq(merchantMembers.active, true),
        eq(merchants.active, true),
      ),
    )
    .orderBy(merchantMembers.id);

  return rows.map((row) => ({
    ...row,
    failedAttempts: row.failedAttempts ?? 0,
  }));
}

/** Lista as lojas ativas de um merchant — consulta única no master (substitui o scan do Merchant Hub legado). */
export async function listActiveStoresForMerchant(merchantId: number): Promise<StoreLite[]> {
  const rows = await masterDb
    .select({ id: stores.id, slug: stores.slug, name: stores.name })
    .from(stores)
    .where(and(eq(stores.merchantId, merchantId), eq(stores.active, true)))
    .orderBy(stores.id);
  return rows;
}

/** Resolve uma loja específica dentro do merchant informado (para `POST /auth/select-store`). */
export async function findActiveStoreInMerchant(
  merchantId: number,
  storeSlug: string,
): Promise<StoreLite | null> {
  const rows = await masterDb
    .select({ id: stores.id, slug: stores.slug, name: stores.name })
    .from(stores)
    .where(
      and(eq(stores.merchantId, merchantId), eq(stores.slug, storeSlug), eq(stores.active, true)),
    )
    .limit(1);
  return rows[0] ?? null;
}
