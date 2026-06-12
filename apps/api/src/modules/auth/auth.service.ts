import argon2 from 'argon2';
import type pg from 'pg';

import type { LoginInput } from './auth.schemas.js';

const MAX_TENTATIVAS = Number.parseInt(process.env.MAX_TENTATIVAS_LOGIN ?? '', 10) || 5;
const BLOQUEIO_MIN = Number.parseInt(process.env.BLOQUEIO_MINUTOS ?? '', 10) || 15;

export interface UsuarioAutenticado {
  id: number;
  nome: string;
  email: string;
  role: 'admin' | 'usuario';
}

export type LoginResult =
  | { ok: true; usuario: UsuarioAutenticado }
  | { ok: false; code: 'UNAUTHORIZED' | 'ACCOUNT_LOCKED' | 'IP_BLOCKED' };

interface UsuarioRow {
  id: number;
  nome: string;
  email: string;
  senha_hash: string;
  role: 'admin' | 'usuario';
  bloqueado_ate: Date | null;
}

/**
 * Autentica um usuário no banco do tenant. Porta o núcleo de
 * `authController.processarLogin` (argon2 + bloqueio por IP/conta), retornando
 * o usuário em caso de sucesso. A população da sessão fica a cargo da rota.
 */
export async function login(
  db: pg.Pool,
  { email, senha }: LoginInput,
  ip: string,
): Promise<LoginResult> {
  const bloqIp = await db.query(
    'SELECT 1 FROM tentativas_login WHERE ip = $1 AND bloqueado_ate > NOW()',
    [ip],
  );
  if (bloqIp.rows.length > 0) {
    return { ok: false, code: 'IP_BLOCKED' };
  }

  const result = await db.query(
    'SELECT * FROM usuarios WHERE email = $1 AND ativo = true',
    [email.toLowerCase().trim()],
  );
  const usuario = result.rows[0] as UsuarioRow | undefined;

  if (usuario?.bloqueado_ate && new Date(usuario.bloqueado_ate) > new Date()) {
    return { ok: false, code: 'ACCOUNT_LOCKED' };
  }

  const senhaCorreta = usuario ? await argon2.verify(usuario.senha_hash, senha) : false;

  if (!senhaCorreta) {
    await registrarTentativaFalha(db, ip, email);
    if (usuario) await incrementarFalhaUsuario(db, usuario.id);
    return { ok: false, code: 'UNAUTHORIZED' };
  }

  await limparTentativas(db, ip, usuario!.id);
  await db.query('UPDATE usuarios SET ultimo_acesso = NOW() WHERE id = $1', [usuario!.id]);

  return {
    ok: true,
    usuario: {
      id: usuario!.id,
      nome: usuario!.nome,
      email: usuario!.email,
      role: usuario!.role,
    },
  };
}

async function registrarTentativaFalha(db: pg.Pool, ip: string, email: string): Promise<void> {
  await db.query(
    `INSERT INTO tentativas_login (ip, email, tentativas, bloqueado_ate)
     VALUES ($1, $2, 1, NULL)
     ON CONFLICT (ip) DO UPDATE
     SET tentativas = tentativas_login.tentativas + 1,
         email = $2,
         bloqueado_ate = CASE
           WHEN tentativas_login.tentativas + 1 >= $3
           THEN NOW() + ($4 || ' minutes')::INTERVAL
           ELSE NULL
         END,
         updated_at = NOW()`,
    [ip, email, MAX_TENTATIVAS, BLOQUEIO_MIN],
  );
}

async function incrementarFalhaUsuario(db: pg.Pool, usuarioId: number): Promise<void> {
  await db.query(
    `UPDATE usuarios SET
       tentativas_falha = tentativas_falha + 1,
       bloqueado_ate = CASE
         WHEN tentativas_falha + 1 >= $2
         THEN NOW() + ($3 || ' minutes')::INTERVAL
         ELSE NULL
       END
     WHERE id = $1`,
    [usuarioId, MAX_TENTATIVAS, BLOQUEIO_MIN],
  );
}

async function limparTentativas(db: pg.Pool, ip: string, usuarioId: number): Promise<void> {
  await db.query('DELETE FROM tentativas_login WHERE ip = $1', [ip]);
  await db.query(
    'UPDATE usuarios SET tentativas_falha = 0, bloqueado_ate = NULL WHERE id = $1',
    [usuarioId],
  );
}
