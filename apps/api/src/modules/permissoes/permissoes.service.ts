import argon2 from 'argon2';
import type { AdminPermissao, CreateAdminInput } from '@lojao/types/permissoes';
import type pg from 'pg';

import {
  deleteAdminById,
  findAllAdmins,
  findUserByEmail,
  insertAdmin,
  toggleAdminAtivo,
} from './permissoes.repository.js';

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

/** Porta `authController.exibirPermissoes`. */
export async function listAdmins(db: pg.Pool): Promise<AdminPermissao[]> {
  return findAllAdmins(db);
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

  const email = input.email.toLowerCase().trim();
  if (await findUserByEmail(db, email)) {
    return { ok: false, code: 'EMAIL_EXISTS', message: 'Email já cadastrado.' };
  }

  const cpfLimpo = input.cpf?.trim() ? formatCpf(input.cpf) : null;
  const senhaHash = await argon2.hash(input.senha, ARGON2_OPTIONS);

  const admin = await insertAdmin(db, {
    nome: input.nome.trim(),
    email,
    senhaHash,
    cpf: cpfLimpo,
  });

  return { ok: true, admin };
}

/** Porta `authController.toggleAdmin`. */
export async function toggleAdmin(
  db: pg.Pool,
  id: number,
  currentUserId: number,
): Promise<'ok' | 'self' | 'not_found'> {
  if (id === currentUserId) return 'self';
  if (!(await toggleAdminAtivo(db, id))) return 'not_found';
  return 'ok';
}

/** Porta `authController.excluirAdmin`. */
export async function deleteAdmin(
  db: pg.Pool,
  id: number,
  currentUserId: number,
): Promise<'ok' | 'self' | 'not_found'> {
  if (id === currentUserId) return 'self';
  if (!(await deleteAdminById(db, id))) return 'not_found';
  return 'ok';
}
