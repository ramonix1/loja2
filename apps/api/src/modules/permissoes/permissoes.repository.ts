import type { AdminPermissao } from '@lojao/types/permissoes';
import type pg from 'pg';

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

export async function findAllAdmins(db: pg.Pool): Promise<AdminPermissao[]> {
  const r = await db.query(
    `SELECT id, nome, email, cpf, ativo, ultimo_acesso, created_at
     FROM usuarios
     WHERE role = 'admin'
     ORDER BY created_at DESC`,
  );
  return r.rows.map(mapAdmin);
}

export async function findUserByEmail(db: pg.Pool, email: string): Promise<boolean> {
  const existe = await db.query('SELECT id FROM usuarios WHERE email = $1', [email]);
  return Boolean(existe.rows[0]);
}

export async function insertAdmin(
  db: pg.Pool,
  input: { nome: string; email: string; senhaHash: string; cpf: string | null },
): Promise<AdminPermissao> {
  const inserted = await db.query(
    `INSERT INTO usuarios (nome, email, senha_hash, role, cpf)
     VALUES ($1, $2, $3, 'admin', $4)
     RETURNING id, nome, email, cpf, ativo, ultimo_acesso, created_at`,
    [input.nome, input.email, input.senhaHash, input.cpf],
  );
  return mapAdmin(inserted.rows[0]!);
}

export async function toggleAdminAtivo(db: pg.Pool, id: number): Promise<boolean> {
  const r = await db.query(
    'UPDATE usuarios SET ativo = NOT ativo WHERE id = $1 AND role = $2 RETURNING id',
    [id, 'admin'],
  );
  return (r.rowCount ?? 0) > 0;
}

export async function deleteAdminById(db: pg.Pool, id: number): Promise<boolean> {
  const r = await db.query("DELETE FROM usuarios WHERE id = $1 AND role = 'admin' RETURNING id", [
    id,
  ]);
  return (r.rowCount ?? 0) > 0;
}
