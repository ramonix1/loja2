import { and, createMasterDb, eq, loginAttempts, merchantMembers, sql } from '@lojao/db';
import { buyers, passwordResetTokens } from '@lojao/db/schema/merchant';
import argon2 from 'argon2';
import crypto from 'node:crypto';

import { masterPool } from '../../lib/master-db.js';
import type { StoreScope } from '../../lib/store-scope.js';
import {
  findActiveMembersByEmail,
  listActiveStoresForMerchant,
  type MemberMatch,
} from '../../lib/resolve-member-login.js';
import { enviarEmailRecuperacao } from '../../services/email.service.js';
import type { LoginInput, RecoverPasswordInput, RegisterInput, ResetPasswordInput } from './auth.schemas.js';

const masterDb = createMasterDb(masterPool);

const MAX_TENTATIVAS = Number.parseInt(process.env.MAX_TENTATIVAS_LOGIN ?? '', 10) || 5;
const BLOQUEIO_MIN = Number.parseInt(process.env.BLOQUEIO_MINUTOS ?? '', 10) || 15;
const TOKEN_EXP_MIN = Number.parseInt(process.env.TOKEN_EXPIRACAO_MINUTOS ?? '', 10) || 30;

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
} as const;

export interface UsuarioAutenticado {
  id: number;
  nome: string;
  email: string;
  role: 'admin' | 'usuario';
}

export type LoginResult =
  | { ok: true; usuario: UsuarioAutenticado }
  | { ok: false; code: 'UNAUTHORIZED' | 'ACCOUNT_LOCKED' | 'IP_BLOCKED' };

export interface MemberAuthenticated {
  id: number;
  name: string;
  email: string;
  role: string;
  merchantId: number;
  merchantSlug: string;
  merchantName: string;
}

export interface StoreSummaryLite {
  id: number;
  slug: string;
  nome: string;
}

export type MerchantAccountLoginResult =
  | { ok: true; step: 'ready'; member: MemberAuthenticated; store: StoreSummaryLite }
  | { ok: true; step: 'select_store'; member: MemberAuthenticated; stores: StoreSummaryLite[] }
  | { ok: false; code: 'NO_MERCHANT_ACCOUNT' | 'UNAUTHORIZED' | 'ACCOUNT_LOCKED' | 'IP_BLOCKED' };

async function isIpBlockedForMerchantLogin(ip: string): Promise<boolean> {
  const rows = await masterDb
    .select({ id: loginAttempts.id })
    .from(loginAttempts)
    .where(and(eq(loginAttempts.ip, ip), sql`${loginAttempts.blockedUntil} > NOW()`))
    .limit(1);
  return rows.length > 0;
}

async function registrarTentativaFalhaMerchant(ip: string, email: string): Promise<void> {
  await masterDb.execute(sql`
    INSERT INTO login_attempts (ip, email, attempts, blocked_until)
    VALUES (${ip}, ${email}, 1, NULL)
    ON CONFLICT (ip) DO UPDATE
    SET attempts = login_attempts.attempts + 1,
        email = ${email},
        blocked_until = CASE
          WHEN login_attempts.attempts + 1 >= ${MAX_TENTATIVAS}
          THEN NOW() + (${BLOQUEIO_MIN} || ' minutes')::INTERVAL
          ELSE NULL
        END,
        updated_at = NOW()
  `);
}

async function limparTentativasMerchant(ip: string): Promise<void> {
  await masterDb.delete(loginAttempts).where(eq(loginAttempts.ip, ip));
}

async function incrementarFalhaMembro(memberId: number, failedAttempts: number): Promise<void> {
  const next = failedAttempts + 1;
  await masterDb
    .update(merchantMembers)
    .set({
      failedAttempts: next,
      blockedUntil:
        next >= MAX_TENTATIVAS ? sql`NOW() + (${BLOQUEIO_MIN} || ' minutes')::INTERVAL` : null,
    })
    .where(eq(merchantMembers.id, memberId));
}

async function limparFalhaMembro(memberId: number): Promise<void> {
  await masterDb
    .update(merchantMembers)
    .set({ failedAttempts: 0, blockedUntil: null, lastAccessAt: sql`NOW()` })
    .where(eq(merchantMembers.id, memberId));
}

async function incrementarFalhaBuyer(
  { merchantDb }: Pick<StoreScope, 'merchantDb'>,
  buyerId: number,
  failedAttempts: number,
): Promise<void> {
  const next = failedAttempts + 1;
  await merchantDb
    .update(buyers)
    .set({
      failedAttempts: next,
      lockedUntil:
        next >= MAX_TENTATIVAS ? sql`NOW() + (${BLOQUEIO_MIN} || ' minutes')::INTERVAL` : null,
    })
    .where(eq(buyers.id, buyerId));
}

async function limparFalhaBuyer({ merchantDb }: Pick<StoreScope, 'merchantDb'>, buyerId: number): Promise<void> {
  await merchantDb
    .update(buyers)
    .set({ failedAttempts: 0, lockedUntil: null, lastAccessAt: sql`NOW()` })
    .where(eq(buyers.id, buyerId));
}

function toMemberAuthenticated(match: MemberMatch): MemberAuthenticated {
  return {
    id: match.memberId,
    name: match.name,
    email: match.email,
    role: match.role,
    merchantId: match.merchantId,
    merchantSlug: match.merchantSlug,
    merchantName: match.merchantName,
  };
}

/**
 * Login **O(1)** da conta merchant (MA5/MA8) — consulta `merchant_members` no master.
 */
export async function loginMerchantAccount(
  { email, senha }: LoginInput,
  ip: string,
): Promise<MerchantAccountLoginResult> {
  const matches = await findActiveMembersByEmail(email);
  const match = matches[0];
  if (!match) {
    return { ok: false, code: 'NO_MERCHANT_ACCOUNT' };
  }

  if (await isIpBlockedForMerchantLogin(ip)) {
    return { ok: false, code: 'IP_BLOCKED' };
  }

  if (match.blockedUntil && new Date(match.blockedUntil) > new Date()) {
    return { ok: false, code: 'ACCOUNT_LOCKED' };
  }

  const senhaCorreta = await argon2.verify(match.passwordHash, senha);
  if (!senhaCorreta) {
    await registrarTentativaFalhaMerchant(ip, email);
    await incrementarFalhaMembro(match.memberId, match.failedAttempts);
    return { ok: false, code: 'UNAUTHORIZED' };
  }

  await limparTentativasMerchant(ip);
  await limparFalhaMembro(match.memberId);

  const member = toMemberAuthenticated(match);
  const activeStores = await listActiveStoresForMerchant(match.merchantId);
  const storesLite: StoreSummaryLite[] = activeStores.map((s) => ({
    id: s.id,
    slug: s.slug,
    nome: s.name,
  }));

  if (storesLite.length === 1) {
    return { ok: true, step: 'ready', member, store: storesLite[0]! };
  }

  return { ok: true, step: 'select_store', member, stores: storesLite };
}

/**
 * MA8 — login de comprador (`buyers`) no merchant DB da loja resolvida.
 * Bloqueio por IP usa `login_attempts` no master (mesmo padrão da conta merchant).
 */
export async function loginBuyer(
  scope: Pick<StoreScope, 'merchantDb' | 'storeId'>,
  { email, senha }: LoginInput,
  ip: string,
): Promise<LoginResult> {
  if (await isIpBlockedForMerchantLogin(ip)) {
    return { ok: false, code: 'IP_BLOCKED' };
  }

  const normalizedEmail = email.toLowerCase().trim();
  const rows = await scope.merchantDb
    .select()
    .from(buyers)
    .where(
      and(
        eq(buyers.email, normalizedEmail),
        eq(buyers.storeId, scope.storeId),
        eq(buyers.active, true),
      ),
    )
    .limit(1);

  const buyer = rows[0];

  if (buyer?.lockedUntil && new Date(buyer.lockedUntil) > new Date()) {
    return { ok: false, code: 'ACCOUNT_LOCKED' };
  }

  const senhaCorreta = buyer ? await argon2.verify(buyer.passwordHash, senha) : false;

  if (!senhaCorreta) {
    await registrarTentativaFalhaMerchant(ip, email);
    if (buyer) {
      await incrementarFalhaBuyer(scope, buyer.id, buyer.failedAttempts ?? 0);
    }
    return { ok: false, code: 'UNAUTHORIZED' };
  }

  await limparTentativasMerchant(ip);
  await limparFalhaBuyer(scope, buyer!.id);

  return {
    ok: true,
    usuario: {
      id: buyer!.id,
      nome: buyer!.name,
      email: buyer!.email,
      role: 'usuario',
    },
  };
}

export type RegisterResult =
  | { ok: true; usuario: UsuarioAutenticado }
  | { ok: false; code: 'VALIDATION_ERROR' | 'EMAIL_EXISTS' };

/** Cadastro público de comprador — tabela `buyers` (schema EN, MA8). */
export async function register(scope: StoreScope, input: RegisterInput): Promise<RegisterResult> {
  const email = input.email.toLowerCase().trim();
  const existe = await scope.merchantDb
    .select({ id: buyers.id })
    .from(buyers)
    .where(and(eq(buyers.email, email), eq(buyers.storeId, scope.storeId)))
    .limit(1);

  if (existe[0]) {
    return { ok: false, code: 'EMAIL_EXISTS' };
  }

  const senhaHash = await argon2.hash(input.senha, ARGON2_OPTIONS);
  const telLimpo = input.telefone.replace(/\D/g, '');
  const cepLimpo = input.cep.replace(/\D/g, '').replace(/^(\d{5})(\d{3})$/, '$1-$2');

  const inserted = await scope.merchantDb
    .insert(buyers)
    .values({
      storeId: scope.storeId,
      name: input.nome.trim(),
      email,
      passwordHash: senhaHash,
      phone: telLimpo,
      postalCode: cepLimpo,
      street: input.logradouro.trim(),
      number: input.numero.trim(),
      complement: input.complemento?.trim() || null,
      district: input.bairro.trim(),
      city: input.cidade.trim(),
      state: input.estado.toUpperCase(),
    })
    .returning({
      id: buyers.id,
      name: buyers.name,
      email: buyers.email,
    });

  const row = inserted[0];
  if (!row) {
    return { ok: false, code: 'VALIDATION_ERROR' };
  }

  return {
    ok: true,
    usuario: {
      id: row.id,
      nome: row.name,
      email: row.email,
      role: 'usuario',
    },
  };
}

export type RecoverPasswordResult = { ok: true };

/** Recuperação de senha por e-mail — resposta genérica (não vaza existência). */
export async function recoverPassword(
  scope: StoreScope,
  { email }: RecoverPasswordInput,
): Promise<RecoverPasswordResult> {
  const normalized = email.toLowerCase().trim();
  const rows = await scope.merchantDb
    .select({ id: buyers.id, name: buyers.name, email: buyers.email })
    .from(buyers)
    .where(
      and(eq(buyers.email, normalized), eq(buyers.storeId, scope.storeId), eq(buyers.active, true)),
    )
    .limit(1);

  const buyer = rows[0];
  if (!buyer) {
    return { ok: true };
  }

  await scope.merchantDb
    .update(passwordResetTokens)
    .set({ used: true })
    .where(
      and(
        eq(passwordResetTokens.buyerId, buyer.id),
        eq(passwordResetTokens.storeId, scope.storeId),
        eq(passwordResetTokens.used, false),
      ),
    );

  const tokenBruto = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(tokenBruto).digest('hex');
  const expiracao = new Date(Date.now() + TOKEN_EXP_MIN * 60 * 1000);

  await scope.merchantDb.insert(passwordResetTokens).values({
    storeId: scope.storeId,
    buyerId: buyer.id,
    tokenHash,
    channel: 'email',
    expiresAt: expiracao,
  });

  await enviarEmailRecuperacao(buyer.email, buyer.name, tokenBruto);
  return { ok: true };
}

export type ResetPasswordResult = { ok: true } | { ok: false; code: 'INVALID_TOKEN' };

export async function resetPassword(
  scope: StoreScope,
  token: string,
  input: ResetPasswordInput,
): Promise<ResetPasswordResult> {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const rows = await scope.merchantDb
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        eq(passwordResetTokens.storeId, scope.storeId),
        eq(passwordResetTokens.used, false),
        sql`${passwordResetTokens.expiresAt} > NOW()`,
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) {
    return { ok: false, code: 'INVALID_TOKEN' };
  }

  const senhaHash = await argon2.hash(input.senha, ARGON2_OPTIONS);
  await scope.merchantDb
    .update(buyers)
    .set({ passwordHash: senhaHash, lockedUntil: null, failedAttempts: 0 })
    .where(and(eq(buyers.id, row.buyerId), eq(buyers.storeId, scope.storeId)));
  await scope.merchantDb
    .update(passwordResetTokens)
    .set({ used: true })
    .where(eq(passwordResetTokens.id, row.id));
  return { ok: true };
}

export async function isResetTokenValid(scope: StoreScope, token: string): Promise<boolean> {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const rows = await scope.merchantDb
    .select({ id: passwordResetTokens.id })
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        eq(passwordResetTokens.storeId, scope.storeId),
        eq(passwordResetTokens.used, false),
        sql`${passwordResetTokens.expiresAt} > NOW()`,
      ),
    )
    .limit(1);
  return rows.length > 0;
}
