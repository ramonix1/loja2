import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

interface FixtureIds {
  pedidoId: number;
  produtoId: number;
  produtoEstoqueId: number;
}

let cache: FixtureIds | null = null;

function loadFixtureIds(): FixtureIds {
  if (cache) return cache;
  const path = join(dirname(fileURLToPath(import.meta.url)), '.fixture-ids.json');
  try {
    cache = JSON.parse(readFileSync(path, 'utf-8')) as FixtureIds;
  } catch {
    cache = { pedidoId: 0, produtoId: 0, produtoEstoqueId: 0 };
  }
  return cache;
}

/** IDs estáveis gravados pelo globalSetup (`seedTestDatabase`). */
export function getTestPedidoId(): number {
  return loadFixtureIds().pedidoId;
}

export function getTestProdutoId(): number {
  return loadFixtureIds().produtoId;
}

export function getTestProdutoEstoqueId(): number {
  return loadFixtureIds().produtoEstoqueId;
}
