import argon2 from 'argon2';
import type { AdminPermissao, CreateAdminInput } from '@lojao/types/permissoes';
import type pg from 'pg';

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
} as const;

function validarCpf(cpf: string): boolean {
  const n = cpf.replace(/\D/g, '');
  if (n.length !== 11 || /^(\d)\1+$/.test(n)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(n[i]!, 10) * (10 - i);
  let r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  if (r !== parseInt(n[9]!, 10)) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(n[i]!, 10) * (11 - i);
  r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  return r === parseInt(n[10]!, 10);
}

function formatCpf(cpf: string): string {
  const n = cpf.replace(/\D/g, '');
  return n.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

function mapAdmin(row: Record<string, unknown>): AdminPermissao {
  return {
    id: Number(row.id),
    nome: String(row.nome),
    email: String(row.email),
    cpf: (row.cpf as string | null) ?? null,
    ativo: Boolean(row.ativo),
    ultimo_acesso: row.ultimo_acesso ? String(row.ultimo_acesso) : null,
    created_at: String(row.created_at),
  };
}

/** Porta `authController.exibirPermissoes`. */
export async function listAdmins(db: pg.Pool): Promise<AdminPermissao[]> {
  const r = await db.query(
    `SELECT id, nome, email, cpf, ativo, ultimo_acesso, created_at
     FROM usuarios
     WHERE role = 'admin'
     ORDER BY created_at DESC`,
  );
  return r.rows.map(mapAdmin);
}

export type CreateAdminResult =
  | { ok: true; admin: AdminPermissao }
  | { ok: false; code: 'VALIDATION_ERROR'; message: string }
  | { ok: false; code: 'EMAIL_EXISTS'; message: string };

/** Porta `authController.criarAdmin`. */
export async function createAdmin(
  db: pg.Pool,
  input: CreateAdminInput,
): Promise<CreateAdminResult> {
  if (input.cpf?.trim() && !validarCpf(input.cpf)) {
    return { ok: false, code: 'VALIDATION_ERROR', message: 'CPF inválido.' };
  }

  const existe = await db.query('SELECT id FROM usuarios WHERE email = $1', [
    input.email.toLowerCase().trim(),
  ]);
  if (existe.rows[0]) {
    return { ok: false, code: 'EMAIL_EXISTS', message: 'Email já cadastrado.' };
  }

  const cpfLimpo = input.cpf?.trim() ? formatCpf(input.cpf) : null;
  const senhaHash = await argon2.hash(input.senha, ARGON2_OPTIONS);

  const inserted = await db.query(
    `INSERT INTO usuarios (nome, email, senha_hash, role, cpf)
     VALUES ($1, $2, $3, 'admin', $4)
     RETURNING id, nome, email, cpf, ativo, ultimo_acesso, created_at`,
    [input.nome.trim(), input.email.toLowerCase().trim(), senhaHash, cpfLimpo],
  );

  return { ok: true, admin: mapAdmin(inserted.rows[0]!) };
}

/** Porta `authController.toggleAdmin`. */
export async function toggleAdmin(
  db: pg.Pool,
  id: number,
  currentUserId: number,
): Promise<'ok' | 'self' | 'not_found'> {
  if (id === currentUserId) return 'self';

  const r = await db.query(
    'UPDATE usuarios SET ativo = NOT ativo WHERE id = $1 AND role = $2 RETURNING id',
    [id, 'admin'],
  );
  if ((r.rowCount ?? 0) === 0) return 'not_found';
  return 'ok';
}

/** Porta `authController.excluirAdmin`. */
export async function deleteAdmin(
  db: pg.Pool,
  id: number,
  currentUserId: number,
): Promise<'ok' | 'self' | 'not_found'> {
  if (id === currentUserId) return 'self';

  const r = await db.query("DELETE FROM usuarios WHERE id = $1 AND role = 'admin' RETURNING id", [
    id,
  ]);
  if ((r.rowCount ?? 0) === 0) return 'not_found';
  return 'ok';
}
