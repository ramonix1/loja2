import type { TenantDatabase } from '@lojao/db';
import { getCachedTenantDb } from '@lojao/db';
import argon2 from 'argon2';
import crypto from 'node:crypto';

import { findAdminTenantsWithEmail } from '../../lib/resolve-login-tenant.js';
import { getTenant } from '../../lib/tenant-db.js';
import { enviarEmailRecuperacao } from '../../services/email.service.js';
import * as authRepository from './auth.repository.js';
import type { LoginInput, RecoverPasswordInput, RegisterInput, ResetPasswordInput } from './auth.schema.js';

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

export interface MerchantStoreSummary {
  slug: string;
  lojaNome: string;
}

export type MerchantHubLoginResult =
  | {
      ok: true;
      step: 'ready';
      usuario: UsuarioAutenticado;
      tenant: MerchantStoreSummary;
    }
  | {
      ok: true;
      step: 'select_tenant';
      usuario: Pick<UsuarioAutenticado, 'nome' | 'email' | 'role'>;
      stores: MerchantStoreSummary[];
    }
  | { ok: false; code: 'NO_TENANT_ACCESS' | 'UNAUTHORIZED' | 'IP_BLOCKED' };

/**
 * Login Merchant Hub — sem tenantSlug no body.
 * Autentica cross-tenant e retorna step `ready` (1 loja) ou `select_tenant` (N lojas).
 */
export async function loginMerchantHub(
  { email, senha }: LoginInput,
  ip: string,
): Promise<MerchantHubLoginResult> {
  const adminTenants = await findAdminTenantsWithEmail(email);
  if (adminTenants.length === 0) {
    return { ok: false, code: 'NO_TENANT_ACCESS' };
  }

  const matching: Array<{ tenant: MerchantStoreSummary; usuario: UsuarioAutenticado }> = [];
  let ipBlocked = false;
  let firstDb: TenantDatabase | null = null;

  for (const tenant of adminTenants) {
    try {
      const { pool, tenant: masterTenant } = await getTenant(tenant.slug);
      const db = getCachedTenantDb(tenant.slug, pool);
      if (!firstDb) firstDb = db;

      const verified = await verifyAdminPassword(db, email, senha, ip);
      if (!verified.ok && verified.code === 'IP_BLOCKED') {
        ipBlocked = true;
        break;
      }
      if (verified.ok) {
        matching.push({
          tenant: { slug: masterTenant.slug, lojaNome: masterTenant.nome },
          usuario: verified.usuario,
        });
      }
    } catch {
      // tenant inacessível — ignora
    }
  }

  if (ipBlocked) {
    return { ok: false, code: 'IP_BLOCKED' };
  }

  if (matching.length === 0) {
    if (firstDb) {
      await login(firstDb, { email, senha }, ip);
    }
    return { ok: false, code: 'UNAUTHORIZED' };
  }

  if (matching.length === 1) {
    const match = matching[0]!;
    const { pool } = await getTenant(match.tenant.slug);
    const db = getCachedTenantDb(match.tenant.slug, pool);
    const finalized = await login(db, { email, senha }, ip);
    if (!finalized.ok) {
      return { ok: false, code: finalized.code === 'IP_BLOCKED' ? 'IP_BLOCKED' : 'UNAUTHORIZED' };
    }
    return {
      ok: true,
      step: 'ready',
      usuario: finalized.usuario,
      tenant: match.tenant,
    };
  }

  const first = matching[0]!;
  return {
    ok: true,
    step: 'select_tenant',
    usuario: {
      nome: first.usuario.nome,
      email: first.usuario.email,
      role: first.usuario.role,
    },
    stores: matching.map((m) => m.tenant),
  };
}

async function verifyAdminPassword(
  db: TenantDatabase,
  email: string,
  senha: string,
  ip: string,
): Promise<
  | { ok: true; usuario: UsuarioAutenticado }
  | { ok: false; code: 'UNAUTHORIZED' | 'ACCOUNT_LOCKED' | 'IP_BLOCKED' }
> {
  if (await authRepository.isIpBlocked(db, ip)) {
    return { ok: false, code: 'IP_BLOCKED' };
  }

  const usuario = await authRepository.findActiveAdminByEmail(db, email);
  if (!usuario) {
    return { ok: false, code: 'UNAUTHORIZED' };
  }

  if (usuario.bloqueadoAte && new Date(usuario.bloqueadoAte) > new Date()) {
    return { ok: false, code: 'ACCOUNT_LOCKED' };
  }

  const senhaCorreta = await argon2.verify(usuario.senhaHash, senha);
  if (!senhaCorreta) {
    return { ok: false, code: 'UNAUTHORIZED' };
  }

  return {
    ok: true,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role as 'admin',
    },
  };
}

/** Valida acesso admin do e-mail autenticado a um tenant e retorna o usuário local. */
export async function resolveAdminInTenant(
  email: string,
  tenantSlug: string,
): Promise<{ ok: true; usuario: UsuarioAutenticado; tenantId: number; lojaNome: string } | { ok: false }> {
  const normalizedEmail = email.trim().toLowerCase();
  const adminTenants = await findAdminTenantsWithEmail(normalizedEmail);
  const allowed = adminTenants.some((t) => t.slug === tenantSlug);
  if (!allowed) return { ok: false };

  try {
    const { pool, tenant } = await getTenant(tenantSlug);
    const db = getCachedTenantDb(tenantSlug, pool);
    const row = await authRepository.findAdminUserInTenant(db, normalizedEmail);
    if (!row) return { ok: false };

    return {
      ok: true,
      usuario: {
        id: row.id,
        nome: row.nome,
        email: row.email,
        role: row.role as 'admin',
      },
      tenantId: tenant.id,
      lojaNome: tenant.nome,
    };
  } catch {
    return { ok: false };
  }
}

/**
 * Autentica um usuário no banco do tenant via Drizzle.
 * Upserts de tentativas permanecem em SQL raw (compatível com legacy).
 */
export async function login(
  db: TenantDatabase,
  { email, senha }: LoginInput,
  ip: string,
): Promise<LoginResult> {
  if (await authRepository.isIpBlocked(db, ip)) {
    return { ok: false, code: 'IP_BLOCKED' };
  }

  const usuario = await authRepository.findActiveUserByEmail(db, email);

  if (usuario?.bloqueadoAte && new Date(usuario.bloqueadoAte) > new Date()) {
    return { ok: false, code: 'ACCOUNT_LOCKED' };
  }

  const senhaCorreta = usuario ? await argon2.verify(usuario.senhaHash, senha) : false;

  if (!senhaCorreta) {
    await authRepository.registrarTentativaFalha(db, ip, email);
    if (usuario) await authRepository.incrementarFalhaUsuario(db, usuario.id);
    return { ok: false, code: 'UNAUTHORIZED' };
  }

  await authRepository.limparTentativas(db, ip, usuario!.id);
  await authRepository.updateLastAccess(db, usuario!.id);

  return {
    ok: true,
    usuario: {
      id: usuario!.id,
      nome: usuario!.nome,
      email: usuario!.email,
      role: usuario!.role as 'admin' | 'usuario',
    },
  };
}

export type RegisterResult =
  | { ok: true; usuario: UsuarioAutenticado }
  | { ok: false; code: 'VALIDATION_ERROR' | 'EMAIL_EXISTS' };

/** Cadastro público — espelha `authController.processarCadastro`. */
export async function register(db: TenantDatabase, input: RegisterInput): Promise<RegisterResult> {
  const email = input.email.toLowerCase().trim();
  if (await authRepository.emailExists(db, email)) {
    return { ok: false, code: 'EMAIL_EXISTS' };
  }

  const senhaHash = await argon2.hash(input.senha, ARGON2_OPTIONS);
  const telLimpo = input.telefone.replace(/\D/g, '');
  const cepLimpo = input.cep.replace(/\D/g, '').replace(/^(\d{5})(\d{3})$/, '$1-$2');

  const row = await authRepository.insertUsuario(db, {
    nome: input.nome.trim(),
    email,
    senhaHash,
    telefone: telLimpo,
    cep: cepLimpo,
    logradouro: input.logradouro.trim(),
    numero: input.numero.trim(),
    complemento: input.complemento?.trim() || null,
    bairro: input.bairro.trim(),
    cidade: input.cidade.trim(),
    estado: input.estado.toUpperCase(),
  });

  if (!row) {
    return { ok: false, code: 'VALIDATION_ERROR' };
  }

  return {
    ok: true,
    usuario: {
      id: row.id,
      nome: row.nome,
      email: row.email,
      role: row.role as 'usuario',
    },
  };
}

export type RecoverPasswordResult = { ok: true };

/** Recuperação de senha por e-mail — resposta genérica (não vaza existência). */
export async function recoverPassword(
  db: TenantDatabase,
  { email }: RecoverPasswordInput,
): Promise<RecoverPasswordResult> {
  const usuario = await authRepository.findActiveUserForRecovery(db, email);
  if (!usuario) {
    return { ok: true };
  }

  await authRepository.invalidateRecoveryTokens(db, usuario.id);

  const tokenBruto = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(tokenBruto).digest('hex');
  const expiracao = new Date(Date.now() + TOKEN_EXP_MIN * 60 * 1000);

  await authRepository.insertRecoveryToken(db, usuario.id, tokenHash, expiracao);

  await enviarEmailRecuperacao(usuario.email, usuario.nome, tokenBruto);
  return { ok: true };
}

export type ResetPasswordResult = { ok: true } | { ok: false; code: 'INVALID_TOKEN' };

export async function resetPassword(
  db: TenantDatabase,
  token: string,
  input: ResetPasswordInput,
): Promise<ResetPasswordResult> {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const row = await authRepository.findValidRecoveryToken(db, tokenHash);
  if (!row) {
    return { ok: false, code: 'INVALID_TOKEN' };
  }

  const senhaHash = await argon2.hash(input.senha, ARGON2_OPTIONS);
  await authRepository.updateUserPassword(db, row.usuarioId, senhaHash);
  await authRepository.markRecoveryTokenUsed(db, row.id);
  return { ok: true };
}

export async function isResetTokenValid(db: TenantDatabase, token: string): Promise<boolean> {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return authRepository.recoveryTokenExists(db, tokenHash);
}
