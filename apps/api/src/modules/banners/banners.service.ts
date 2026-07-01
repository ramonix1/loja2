import type { BannerDetail, BannerFieldsInput, BannerListItem, ProdutoOption } from '@lojao/types/banners';
import type pg from 'pg';

import type { ImageStorage } from '../../ports/image-storage.js';
import {
  deleteBannerById,
  findAllBanners,
  findBannerById,
  findBannerImage,
  findProdutoOptions,
  insertBanner,
  toggleBannerAtivoRecord,
  updateBannerWithImage,
  updateBannerWithoutImage,
} from './banners.repository.js';

export async function listBanners(db: pg.Pool): Promise<BannerListItem[]> {
  return findAllBanners(db);
}

export async function getBanner(db: pg.Pool, id: number): Promise<BannerDetail | null> {
  return findBannerById(db, id);
}

export async function listProdutoOptions(db: pg.Pool): Promise<ProdutoOption[]> {
  return findProdutoOptions(db);
}

export async function createBanner(
  db: pg.Pool,
  storage: ImageStorage,
  input: BannerFieldsInput,
  image: { buffer: Buffer; mimetype: string; filename: string },
): Promise<{ id: number }> {
  const imagemUrl = await storage.save({
    buffer: image.buffer,
    originalFilename: image.filename,
    mimetype: image.mimetype,
  });
  const produtoId = input.produto_id ?? null;
  const ctaUrl = input.cta_url?.trim() || null;

  return insertBanner(db, {
    titulo: input.titulo,
    subtitulo: input.subtitulo ?? null,
    imagemUrl,
    cta_texto: input.cta_texto || 'Ver oferta',
    cta_url: ctaUrl,
    produto_id: produtoId,
    ativo: input.ativo,
    ordem: input.ordem,
  });
}

export async function updateBanner(
  db: pg.Pool,
  storage: ImageStorage,
  id: number,
  input: BannerFieldsInput,
  image?: { buffer: Buffer; mimetype: string; filename: string } | null,
): Promise<boolean> {
  const existingImage = await findBannerImage(db, id);
  if (existingImage === null) return false;

  const produtoId = input.produto_id ?? null;
  const ctaUrl = input.cta_url?.trim() || null;

  if (image) {
    await storage.delete(existingImage);
    const imagemUrl = await storage.save({
      buffer: image.buffer,
      originalFilename: image.filename,
      mimetype: image.mimetype,
    });
    await updateBannerWithImage(db, id, {
      titulo: input.titulo,
      subtitulo: input.subtitulo ?? null,
      imagemUrl,
      cta_texto: input.cta_texto || 'Ver oferta',
      cta_url: ctaUrl,
      produto_id: produtoId,
      ativo: input.ativo,
      ordem: input.ordem,
    });
  } else {
    await updateBannerWithoutImage(db, id, {
      titulo: input.titulo,
      subtitulo: input.subtitulo ?? null,
      cta_texto: input.cta_texto || 'Ver oferta',
      cta_url: ctaUrl,
      produto_id: produtoId,
      ativo: input.ativo,
      ordem: input.ordem,
    });
  }

  return true;
}

export async function deleteBanner(
  db: pg.Pool,
  storage: ImageStorage,
  id: number,
): Promise<boolean> {
  const imagem = await findBannerImage(db, id);
  if (imagem === null) return false;

  await storage.delete(imagem);
  return deleteBannerById(db, id);
}

export async function toggleBannerAtivo(db: pg.Pool, id: number): Promise<boolean> {
  return toggleBannerAtivoRecord(db, id);
}
