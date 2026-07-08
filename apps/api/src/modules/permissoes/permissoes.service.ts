import type { AdminPermissao, CreateAdminInput } from '@lojao/types/permissoes';

import type { StoreScope } from '../../lib/store-scope.js';
import {
  type CreateAdminResult,
  deleteAdminRecord,
  findAdmins,
  insertAdmin,
  toggleAdminRecord,
} from './permissoes.repository.js';

export async function listAdmins(scope: StoreScope): Promise<AdminPermissao[]> {
  return findAdmins(scope);
}

export type { CreateAdminResult };

export async function createAdmin(
  scope: StoreScope,
  input: CreateAdminInput,
): Promise<CreateAdminResult> {
  return insertAdmin(scope, input);
}

export async function toggleAdmin(
  scope: StoreScope,
  id: number,
  currentMemberId: number,
): Promise<'ok' | 'self' | 'not_found'> {
  return toggleAdminRecord(scope, id, currentMemberId);
}

export async function deleteAdmin(
  scope: StoreScope,
  id: number,
  currentMemberId: number,
): Promise<'ok' | 'self' | 'not_found'> {
  return deleteAdminRecord(scope, id, currentMemberId);
}
