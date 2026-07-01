import type { TenantDatabase } from '@lojao/db';
import { and, eq, sql, tentativasLogin, tokensRecuperacao, usuarios } from '@lojao/db';

const MAX_TENTATIVAS = Number.parseInt(process.env.MAX_TENTATIVAS_LOGIN ?? '', 10) || 5;
const BLOQUEIO_MIN = Number.parseInt(process.env.BLOQUEIO_MINUTOS ?? '', 10) || 15;

export interface UsuarioRow {
  id: number;
  nome: string;
  email: string;
  senhaHash: string;
  role: string;
  ativo: boolean | null;
  bloqueadoAte: Date | null;
}

export interface AdminUsuarioRow {
  id: number;
  nome: string;
  email: string;
  role: string;
}

export interface UsuarioInsertResult {
  id: number;
  nome: string;
  email: string;
  role: string;
}

export interface RecoveryUsuarioRow {
  id: number;
  nome: string;
  email: string;
}

export interface RecoveryTokenRow {
  id: number;
  usuarioId: number;
}

export async function isIpBlocked(db: TenantDatabase, ip: string): Promise<boolean> {
  const bloqIp = await db
    .select({ id: tentativasLogin.id })
    .from(tentativasLogin)
    .where(and(eq(tentativasLogin.ip, ip), sql`${tentativasLogin.bloqueadoAte} > NOW()`))
    .limit(1);

  return bloqIp.length > 0;
}

export async function findActiveAdminByEmail(
  db: TenantDatabase,
  email: string,
): Promise<UsuarioRow | undefined> {
  const normalizedEmail = email.toLowerCase().trim();
  const rows = await db
    .select()
    .from(usuarios)
    .where(
      and(eq(usuarios.email, normalizedEmail), eq(usuarios.ativo, true), eq(usuarios.role, 'admin')),
    )
    .limit(1);

  return rows[0];
}

export async function findActiveUserByEmail(
  db: TenantDatabase,
  email: string,
): Promise<UsuarioRow | undefined> {
  const normalizedEmail = email.toLowerCase().trim();
  const rows = await db
    .select()
    .from(usuarios)
    .where(and(eq(usuarios.email, normalizedEmail), eq(usuarios.ativo, true)))
    .limit(1);

  return rows[0];
}

export async function findAdminUserInTenant(
  db: TenantDatabase,
  email: string,
): Promise<AdminUsuarioRow | undefined> {
  const normalizedEmail = email.trim().toLowerCase();
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

  return rows[0];
}

export async function updateLastAccess(db: TenantDatabase, usuarioId: number): Promise<void> {
  await db
    .update(usuarios)
    .set({ ultimoAcesso: sql`NOW()` })
    .where(eq(usuarios.id, usuarioId));
}

export async function registrarTentativaFalha(
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

export async function incrementarFalhaUsuario(db: TenantDatabase, usuarioId: number): Promise<void> {
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

export async function limparTentativas(
  db: TenantDatabase,
  ip: string,
  usuarioId: number,
): Promise<void> {
  await db.delete(tentativasLogin).where(eq(tentativasLogin.ip, ip));
  await db
    .update(usuarios)
    .set({ tentativasFalha: 0, bloqueadoAte: null })
    .where(eq(usuarios.id, usuarioId));
}

export async function emailExists(db: TenantDatabase, email: string): Promise<boolean> {
  const existe = await db
    .select({ id: usuarios.id })
    .from(usuarios)
    .where(eq(usuarios.email, email))
    .limit(1);

  return Boolean(existe[0]);
}

export async function insertUsuario(
  db: TenantDatabase,
  values: {
    nome: string;
    email: string;
    senhaHash: string;
    telefone: string;
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string | null;
    bairro: string;
    cidade: string;
    estado: string;
  },
): Promise<UsuarioInsertResult | undefined> {
  const inserted = await db
    .insert(usuarios)
    .values({
      nome: values.nome,
      email: values.email,
      senhaHash: values.senhaHash,
      role: 'usuario',
      telefone: values.telefone,
      cep: values.cep,
      logradouro: values.logradouro,
      numero: values.numero,
      complemento: values.complemento,
      bairro: values.bairro,
      cidade: values.cidade,
      estado: values.estado,
    })
    .returning({
      id: usuarios.id,
      nome: usuarios.nome,
      email: usuarios.email,
      role: usuarios.role,
    });

  return inserted[0];
}

export async function findActiveUserForRecovery(
  db: TenantDatabase,
  email: string,
): Promise<RecoveryUsuarioRow | undefined> {
  const normalized = email.toLowerCase().trim();
  const rows = await db
    .select({ id: usuarios.id, nome: usuarios.nome, email: usuarios.email })
    .from(usuarios)
    .where(and(eq(usuarios.email, normalized), eq(usuarios.ativo, true)))
    .limit(1);

  return rows[0];
}

export async function invalidateRecoveryTokens(
  db: TenantDatabase,
  usuarioId: number,
): Promise<void> {
  await db
    .update(tokensRecuperacao)
    .set({ usado: true })
    .where(and(eq(tokensRecuperacao.usuarioId, usuarioId), eq(tokensRecuperacao.usado, false)));
}

export async function insertRecoveryToken(
  db: TenantDatabase,
  usuarioId: number,
  tokenHash: string,
  expiraEm: Date,
): Promise<void> {
  await db.insert(tokensRecuperacao).values({
    usuarioId,
    tokenHash,
    canal: 'email',
    expiraEm,
  });
}

export async function findValidRecoveryToken(
  db: TenantDatabase,
  tokenHash: string,
): Promise<RecoveryTokenRow | undefined> {
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

  return rows[0];
}

export async function updateUserPassword(
  db: TenantDatabase,
  usuarioId: number,
  senhaHash: string,
): Promise<void> {
  await db
    .update(usuarios)
    .set({ senhaHash, bloqueadoAte: null, tentativasFalha: 0 })
    .where(eq(usuarios.id, usuarioId));
}

export async function markRecoveryTokenUsed(db: TenantDatabase, tokenId: number): Promise<void> {
  await db.update(tokensRecuperacao).set({ usado: true }).where(eq(tokensRecuperacao.id, tokenId));
}

export async function recoveryTokenExists(db: TenantDatabase, tokenHash: string): Promise<boolean> {
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
