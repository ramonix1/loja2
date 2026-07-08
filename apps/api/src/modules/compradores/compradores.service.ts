import type {
  CompradorDetailResponse,
  CompradorListItem,
  CompradoresTotais,
  ListCompradoresQuery,
} from '@lojao/types/compradores';

import type { StoreScope } from '../../lib/store-scope.js';
import { findCompradorById, findCompradores } from './compradores.repository.js';

export async function listCompradores(
  scope: StoreScope,
  query: ListCompradoresQuery,
): Promise<{ compradores: CompradorListItem[]; totais: CompradoresTotais }> {
  return findCompradores(scope, query);
}

export async function getComprador(
  scope: StoreScope,
  id: number,
): Promise<CompradorDetailResponse | null> {
  return findCompradorById(scope, id);
}
