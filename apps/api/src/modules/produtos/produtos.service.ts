import type { ProdutoDetail, ProdutoFieldsInput, ProdutoListItem } from '@lojao/types/produtos';

import type { StoreScope } from '../../lib/store-scope.js';
import type { ImageStorage } from '../../ports/image-storage.js';
import {
  deleteProdutoImageById,
  deleteProdutoRecord,
  findProdutoById,
  findProdutoEstoque,
  findProdutoImageById,
  findProdutoImages,
  findProdutos,
  insertInventoryMovement,
  insertProduto,
  insertProdutoImage,
  updateProdutoEstoqueRecord,
  updateProdutoRecord,
} from './produtos.repository.js';

export async function listProdutos(scope: StoreScope): Promise<ProdutoListItem[]> {
  return findProdutos(scope);
}

export async function getProduto(scope: StoreScope, id: number): Promise<ProdutoDetail | null> {
  return findProdutoById(scope, id);
}

export async function createProduto(
  scope: StoreScope,
  storage: ImageStorage,
  input: ProdutoFieldsInput,
  images: Array<{ buffer: Buffer; mimetype: string; filename: string }>,
): Promise<{ id: number }> {
  const { id } = await insertProduto(scope, input);

  for (const file of images) {
    const url = await storage.save({
      buffer: file.buffer,
      originalFilename: file.filename,
      mimetype: file.mimetype,
    });
    await insertProdutoImage(scope, id, url);
  }

  return { id };
}

export async function updateProduto(
  scope: StoreScope,
  storage: ImageStorage,
  id: number,
  input: ProdutoFieldsInput,
  images: Array<{ buffer: Buffer; mimetype: string; filename: string }>,
): Promise<boolean> {
  const updated = await updateProdutoRecord(scope, id, input);
  if (!updated) return false;

  for (const file of images) {
    const url = await storage.save({
      buffer: file.buffer,
      originalFilename: file.filename,
      mimetype: file.mimetype,
    });
    await insertProdutoImage(scope, id, url);
  }

  return true;
}

export async function deleteProduto(
  scope: StoreScope,
  storage: ImageStorage,
  id: number,
): Promise<boolean> {
  const imagens = await findProdutoImages(scope, id);
  for (const img of imagens) {
    await storage.delete(img.url);
  }
  await deleteProdutoRecord(scope, id);
  return imagens.length >= 0;
}

export async function deleteProdutoImagem(
  scope: StoreScope,
  storage: ImageStorage,
  imagemId: number,
): Promise<boolean> {
  const img = await findProdutoImageById(scope, imagemId);
  if (!img) return false;
  await storage.delete(img.url);
  await deleteProdutoImageById(scope, imagemId);
  return true;
}

export async function updateProdutoEstoque(
  scope: StoreScope,
  id: number,
  estoque: number | null,
  observacao?: string,
): Promise<boolean> {
  const anterior = await findProdutoEstoque(scope, id);
  if (!anterior) return false;

  await updateProdutoEstoqueRecord(scope, id, estoque);

  if (estoque !== null) {
    const estoqueAnterior = anterior.stock;
    const diff = estoqueAnterior !== null ? estoque - estoqueAnterior : estoque;
    const tipo = diff >= 0 ? 'adjustment' : 'outbound';
    await insertInventoryMovement(scope, id, tipo, diff, observacao || 'Ajuste manual');
  }

  return true;
}
