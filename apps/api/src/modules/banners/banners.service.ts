import type { BannerDetail, BannerFieldsInput, BannerListItem, ProdutoOption } from '@lojao/types/banners';

import type { StoreScope } from '../../lib/store-scope.js';
import type { ImageStorage } from '../../ports/image-storage.js';
import {
  deleteBannerRecord,
  findBannerById,
  findBannerImageUrl,
  findBanners,
  findProdutoOptions,
  insertBanner,
  toggleBannerAtivoRecord,
  updateBannerRecord,
} from './banners.repository.js';

export async function listBanners(scope: StoreScope): Promise<BannerListItem[]> {
  return findBanners(scope);
}

export async function getBanner(
  scope: StoreScope,
  id: number,
): Promise<BannerDetail | null> {
  return findBannerById(scope, id);
}

export async function listProdutoOptions(scope: StoreScope): Promise<ProdutoOption[]> {
  return findProdutoOptions(scope);
}

export async function createBanner(
  scope: StoreScope,
  storage: ImageStorage,
  input: BannerFieldsInput,
  image: { buffer: Buffer; mimetype: string; filename: string },
): Promise<{ id: number }> {
  const imagemUrl = await storage.save({
    buffer: image.buffer,
    originalFilename: image.filename,
    mimetype: image.mimetype,
  });
  return insertBanner(scope, input, imagemUrl);
}

export async function updateBanner(
  scope: StoreScope,
  storage: ImageStorage,
  id: number,
  input: BannerFieldsInput,
  image?: { buffer: Buffer; mimetype: string; filename: string } | null,
): Promise<boolean> {
  const existingUrl = await findBannerImageUrl(scope, id);
  if (existingUrl === null) return false;

  let newImageUrl: string | undefined;
  if (image) {
    await storage.delete(existingUrl);
    newImageUrl = await storage.save({
      buffer: image.buffer,
      originalFilename: image.filename,
      mimetype: image.mimetype,
    });
  }

  return updateBannerRecord(scope, id, input, newImageUrl);
}

export async function deleteBanner(
  scope: StoreScope,
  storage: ImageStorage,
  id: number,
): Promise<boolean> {
  const imageUrl = await findBannerImageUrl(scope, id);
  if (imageUrl === null) return false;

  await storage.delete(imageUrl);
  await deleteBannerRecord(scope, id);
  return true;
}

export async function toggleBannerAtivo(scope: StoreScope, id: number): Promise<boolean> {
  return toggleBannerAtivoRecord(scope, id);
}
