import type { TenantDatabase } from '@lojao/db';
import { and, eq, sql, tentativasLogin, tokensRecuperacao, usuarios, getCachedTenantDb } from '@lojao/db';
import argon2 from 'argon2';
import crypto from 'node:crypto';

import { findAdminTenantsWithEmail } from '../../lib/resolve-login-tenant.js';
import { getTenant } from '../../lib/tenant-db.js';
import { enviarEmailRecuperacao } from '../../services/email.service.js';
import type { LoginInput, RecoverPasswordInput, RegisterInput, ResetPasswordInput } from './auth.schemas.js';

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
  const bloqIp = await db
    .select({ id: tentativasLogin.id })
    .from(tentativasLogin)
    .where(and(eq(tentativasLogin.ip, ip), sql`${tentativasLogin.bloqueadoAte} > NOW()`))
    .limit(1);

  if (bloqIp.length > 0) {
    return { ok: false, code: 'IP_BLOCKED' };
  }

  const normalizedEmail = email.toLowerCase().trim();
  const rows = await db
    .select()
    .from(usuarios)
    .where(
      and(eq(usuarios.email, normalizedEmail), eq(usuarios.ativo, true), eq(usuarios.role, 'admin')),
    )
    .limit(1);

  const usuario = rows[0];
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
    const rows = await db
      .select({
        id: usuarios.id,
        nome: usuarios.nome,
        email: usuarios.email,
        role: usuarios.role,
      })
      .from(usuarios)
      .where(
        and(
          eq(usuarios.email, normalizedEmail),
          eq(usuarios.ativo, true),
          eq(usuarios.role, 'admin'),
        ),
      )
      .limit(1);

    const row = rows[0];
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
  const bloqIp = await db
    .select({ id: tentativasLogin.id })
    .from(tentativasLogin)
    .where(and(eq(tentativasLogin.ip, ip), sql`${tentativasLogin.bloqueadoAte} > NOW()`))
    .limit(1);

  if (bloqIp.length > 0) {
    return { ok: false, code: 'IP_BLOCKED' };
  }

  const normalizedEmail = email.toLowerCase().trim();
  const rows = await db
    .select()
    .from(usuarios)
    .where(and(eq(usuarios.email, normalizedEmail), eq(usuarios.ativo, true)))
    .limit(1);

  const usuario = rows[0];

  if (usuario?.bloqueadoAte && new Date(usuario.bloqueadoAte) > new Date()) {
    return { ok: false, code: 'ACCOUNT_LOCKED' };
  }

  const senhaCorreta = usuario ? await argon2.verify(usuario.senhaHash, senha) : false;

  if (!senhaCorreta) {
    await registrarTentativaFalha(db, ip, email);
    if (usuario) await incrementarFalhaUsuario(db, usuario.id);
    return { ok: false, code: 'UNAUTHORIZED' };
  }

  await limparTentativas(db, ip, usuario!.id);
  await db
    .update(usuarios)
    .set({ ultimoAcesso: sql`NOW()` })
    .where(eq(usuarios.id, usuario!.id));

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

async function registrarTentativaFalha(
  db: TenantDatabase,
  ip: string,
  email: string,
): Promise<void> {
  await db.execute(sql`
    INSERT INTO tentativas_login (ip, email, tentativas, bloqueado_ate)
    VALUES (${ip}, ${email}, 1, NULL)
    ON CONFLICT (ip) DO UPDATE
    SET tentativas = tentativas_login.tentativas + 1,
        email = ${email},
        bloqueado_ate = CASE
          WHEN tentativas_login.tentativas + 1 >= ${MAX_TENTATIVAS}
          THEN NOW() + (${BLOQUEIO_MIN} || ' minutes')::INTERVAL
          ELSE NULL
        END,
        updated_at = NOW()
  `);
}

async function incrementarFalhaUsuario(db: TenantDatabase, usuarioId: number): Promise<void> {
  await db.execute(sql`
    UPDATE usuarios SET
      tentativas_falha = tentativas_falha + 1,
      bloqueado_ate = CASE
        WHEN tentativas_falha + 1 >= ${MAX_TENTATIVAS}
        THEN NOW() + (${BLOQUEIO_MIN} || ' minutes')::INTERVAL
        ELSE NULL
      END
    WHERE id = ${usuarioId}
  `);
}

async function limparTentativas(db: TenantDatabase, ip: string, usuarioId: number): Promise<void> {
  await db.delete(tentativasLogin).where(eq(tentativasLogin.ip, ip));
  await db
    .update(usuarios)
    .set({ tentativasFalha: 0, bloqueadoAte: null })
    .where(eq(usuarios.id, usuarioId));
}

export type RegisterResult =
  | { ok: true; usuario: UsuarioAutenticado }
  | { ok: false; code: 'VALIDATION_ERROR' | 'EMAIL_EXISTS' };

/** Cadastro público — espelha `authController.processarCadastro`. */
export async function register(db: TenantDatabase, input: RegisterInput): Promise<RegisterResult> {
  const email = input.email.toLowerCase().trim();
  const existe = await db
    .select({ id: usuarios.id })
    .from(usuarios)
    .where(eq(usuarios.email, email))
    .limit(1);

  if (existe[0]) {
    return { ok: false, code: 'EMAIL_EXISTS' };
  }

  const senhaHash = await argon2.hash(input.senha, ARGON2_OPTIONS);
  const telLimpo = input.telefone.replace(/\D/g, '');
  const cepLimpo = input.cep.replace(/\D/g, '').replace(/^(\d{5})(\d{3})$/, '$1-$2');

  const inserted = await db
    .insert(usuarios)
    .values({
      nome: input.nome.trim(),
      email,
      senhaHash,
      role: 'usuario',
      telefone: telLimpo,
      cep: cepLimpo,
      logradouro: input.logradouro.trim(),
      numero: input.numero.trim(),
      complemento: input.complemento?.trim() || null,
      bairro: input.bairro.trim(),
      cidade: input.cidade.trim(),
      estado: input.estado.toUpperCase(),
    })
    .returning({
      id: usuarios.id,
      nome: usuarios.nome,
      email: usuarios.email,
      role: usuarios.role,
    });

  const row = inserted[0];
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
  const normalized = email.toLowerCase().trim();
  const rows = await db
    .select({ id: usuarios.id, nome: usuarios.nome, email: usuarios.email })
    .from(usuarios)
    .where(and(eq(usuarios.email, normalized), eq(usuarios.ativo, true)))
    .limit(1);

  const usuario = rows[0];
  if (!usuario) {
    return { ok: true };
  }

  await db
    .update(tokensRecuperacao)
    .set({ usado: true })
    .where(and(eq(tokensRecuperacao.usuarioId, usuario.id), eq(tokensRecuperacao.usado, false)));

  const tokenBruto = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(tokenBruto).digest('hex');
  const expiracao = new Date(Date.now() + TOKEN_EXP_MIN * 60 * 1000);

  await db.insert(tokensRecuperacao).values({
    usuarioId: usuario.id,
    tokenHash,
    canal: 'email',
    expiraEm: expiracao,
  });

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
  const rows = await db
    .select()
    .from(tokensRecuperacao)
    .where(
      and(
        eq(tokensRecuperacao.tokenHash, tokenHash),
        eq(tokensRecuperacao.usado, false),
        sql`${tokensRecuperacao.expiraEm} > NOW()`,
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) {
    return { ok: false, code: 'INVALID_TOKEN' };
  }

  const senhaHash = await argon2.hash(input.senha, ARGON2_OPTIONS);
  await db
    .update(usuarios)
    .set({ senhaHash, bloqueadoAte: null, tentativasFalha: 0 })
    .where(eq(usuarios.id, row.usuarioId));
  await db.update(tokensRecuperacao).set({ usado: true }).where(eq(tokensRecuperacao.id, row.id));
  return { ok: true };
}

export async function isResetTokenValid(db: TenantDatabase, token: string): Promise<boolean> {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const rows = await db
    .select({ id: tokensRecuperacao.id })
    .from(tokensRecuperacao)
    .where(
      and(
        eq(tokensRecuperacao.tokenHash, tokenHash),
        eq(tokensRecuperacao.usado, false),
        sql`${tokensRecuperacao.expiraEm} > NOW()`,
      ),
    )
    .limit(1);
  return rows.length > 0;
}
