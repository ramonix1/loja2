import type pg from 'pg';

import type {
  CategoriaDetail,
  CategoriaListItem,
  CreateCategoriaInput,
  UpdateCategoriaInput,
} from '@lojao/types/categorias';

import {
  categoriaExists,
  deleteCategoriaRecord,
  findAllCategorias,
  findCategoriaById,
  insertCategoria,
  updateCategoriaRecord,
} from './categorias.repository.js';

export async function listCategorias(db: pg.Pool): Promise<CategoriaListItem[]> {
  return findAllCategorias(db);
}

export async function getCategoria(db: pg.Pool, id: number): Promise<CategoriaDetail | null> {
  return findCategoriaById(db, id);
}

export async function createCategoria(
  db: pg.Pool,
  input: CreateCategoriaInput,
): Promise<{ id: number }> {
  return insertCategoria(db, input);
}

/** Porta `categoriaController.atualizar` — atualiza nome/ordem e reassocia produtos. */
export async function updateCategoria(
  db: pg.Pool,
  id: number,
  input: UpdateCategoriaInput,
): Promise<boolean> {
  if (!(await categoriaExists(db, id))) return false;
  await updateCategoriaRecord(db, id, input);
  return true;
}

/** Porta `categoriaController.remover` — desvincula produtos e exclui categoria. */
export async function deleteCategoria(db: pg.Pool, id: number): Promise<boolean> {
  if (!(await categoriaExists(db, id))) return false;
  await deleteCategoriaRecord(db, id);
  return true;
}
