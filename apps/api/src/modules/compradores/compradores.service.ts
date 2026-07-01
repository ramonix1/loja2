import type pg from 'pg';

import type {
  CompradorDetailResponse,
  CompradorListItem,
  CompradoresTotais,
  ListCompradoresQuery,
} from '@lojao/types/compradores';

import { findCompradorById, findCompradores } from './compradores.repository.js';

/** Porta `compradorController.listar`. */
export async function listCompradores(
  db: pg.Pool,
  query: ListCompradoresQuery,
): Promise<{ compradores: CompradorListItem[]; totais: CompradoresTotais }> {
  return findCompradores(db, query);
}

/** Porta `compradorController.detalhe`. */
export async function getComprador(
  db: pg.Pool,
  id: number,
): Promise<CompradorDetailResponse | null> {
  return findCompradorById(db, id);
}
