import type {
  CategoriaDetail,
  CategoriaListItem,
  CreateCategoriaInput,
  UpdateCategoriaInput,
} from '@lojao/types/categorias';

import type { StoreScope } from '../../lib/store-scope.js';
import {
  deleteCategoriaRecord,
  existsCategoria,
  findCategoriaById,
  findCategorias,
  insertCategoria,
  updateCategoriaRecord,
} from './categorias.repository.js';

export async function listCategorias(scope: StoreScope): Promise<CategoriaListItem[]> {
  return findCategorias(scope);
}

export async function getCategoria(
  scope: StoreScope,
  id: number,
): Promise<CategoriaDetail | null> {
  return findCategoriaById(scope, id);
}

export async function createCategoria(
  scope: StoreScope,
  input: CreateCategoriaInput,
): Promise<{ id: number }> {
  return insertCategoria(scope, input);
}

export async function updateCategoria(
  scope: StoreScope,
  id: number,
  input: UpdateCategoriaInput,
): Promise<boolean> {
  const exists = await existsCategoria(scope, id);
  if (!exists) return false;

  await updateCategoriaRecord(scope, id, input);
  return true;
}

export async function deleteCategoria(scope: StoreScope, id: number): Promise<boolean> {
  const exists = await existsCategoria(scope, id);
  if (!exists) return false;

  await deleteCategoriaRecord(scope, id);
  return true;
}
