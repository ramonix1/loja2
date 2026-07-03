import argon2 from 'argon2';
import type { AdminPermissao, CreateAdminInput } from '@lojao/types/permissoes';
import { and, createMasterDb, eq, merchantMembers } from '@lojao/db';

import { masterPool } from '../../lib/master-db.js';
import type { StoreScope } from '../../lib/store-scope.js';

const masterDb = createMasterDb(masterPool);

const ADMIN_ROLES = ['owner', 'admin', 'operator'] as const;

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

function mapMember(row: {
  id: number;
  name: string;
  email: string;
  active: boolean | null;
  last_access_at: Date | string | null;
  created_at: Date | string | null;
}): AdminPermissao {
  return {
    id: row.id,
    nome: row.name,
    email: row.email,
    cpf: null,
    ativo: Boolean(row.active),
    ultimo_acesso: row.last_access_at
      ? row.last_access_at instanceof Date
        ? row.last_access_at.toISOString()
        : String(row.last_access_at)
      : null,
    created_at:
      row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at ?? ''),
  };
}

/** Porta `authController.exibirPermissoes` — operadores em `merchant_members` (master). */
export async function listAdmins({ merchantId }: StoreScope): Promise<AdminPermissao[]> {
  const r = await masterPool.query(
    `SELECT id, name, email, active, last_access_at, created_at
     FROM merchant_members
     WHERE merchant_id = $1 AND role = ANY($2::text[])
     ORDER BY created_at DESC`,
    [merchantId, ADMIN_ROLES],
  );
  return r.rows.map((row) => mapMember(row as Parameters<typeof mapMember>[0]));
}

export type CreateAdminResult =
  | { ok: true; admin: AdminPermissao }
  | { ok: false; code: 'VALIDATION_ERROR'; message: string }
  | { ok: false; code: 'EMAIL_EXISTS'; message: string };

/** Porta `authController.criarAdmin`. */
export async function createAdmin(
  { merchantId }: StoreScope,
  input: CreateAdminInput,
): Promise<CreateAdminResult> {
  if (input.cpf?.trim() && !validarCpf(input.cpf)) {
    return { ok: false, code: 'VALIDATION_ERROR', message: 'CPF inválido.' };
  }

  const email = input.email.toLowerCase().trim();
  const [existing] = await masterDb
    .select({ id: merchantMembers.id })
    .from(merchantMembers)
    .where(and(eq(merchantMembers.merchantId, merchantId), eq(merchantMembers.email, email)))
    .limit(1);

  if (existing) {
    return { ok: false, code: 'EMAIL_EXISTS', message: 'Email já cadastrado.' };
  }

  const senhaHash = await argon2.hash(input.senha, ARGON2_OPTIONS);

  const inserted = await masterPool.query(
    `INSERT INTO merchant_members (merchant_id, name, email, password_hash, role, active)
     VALUES ($1, $2, $3, $4, 'operator', true)
     RETURNING id, name, email, active, last_access_at, created_at`,
    [merchantId, input.nome.trim(), email, senhaHash],
  );

  return { ok: true, admin: mapMember(inserted.rows[0] as Parameters<typeof mapMember>[0]) };
}

/** Porta `authController.toggleAdmin`. */
export async function toggleAdmin(
  { merchantId }: StoreScope,
  id: number,
  currentMemberId: number,
): Promise<'ok' | 'self' | 'not_found'> {
  if (id === currentMemberId) return 'self';

  const r = await masterPool.query(
    `UPDATE merchant_members SET active = NOT active
     WHERE id = $1 AND merchant_id = $2 AND role = ANY($3::text[])
     RETURNING id`,
    [id, merchantId, ADMIN_ROLES],
  );
  if ((r.rowCount ?? 0) === 0) return 'not_found';
  return 'ok';
}

/** Porta `authController.excluirAdmin`. */
export async function deleteAdmin(
  { merchantId }: StoreScope,
  id: number,
  currentMemberId: number,
): Promise<'ok' | 'self' | 'not_found'> {
  if (id === currentMemberId) return 'self';

  const r = await masterPool.query(
    `DELETE FROM merchant_members
     WHERE id = $1 AND merchant_id = $2 AND role = 'operator'
     RETURNING id`,
    [id, merchantId],
  );
  if ((r.rowCount ?? 0) === 0) return 'not_found';
  return 'ok';
}
