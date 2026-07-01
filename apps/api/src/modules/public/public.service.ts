import type {
  PublicBanner,
  PublicCategory,
  PublicProduct,
  PublicProductDetail,
  PublicStoreData,
} from './public.schema.js';
import type { TenantDatabase } from '@lojao/db';
import type pg from 'pg';

import {
  findAllPublicProducts,
  findPublicBanners,
  findPublicCategoriesWithProducts,
  findPublicProductById,
  findPublicProductsWithoutCategory,
  findStoreConfigs,
} from './public.repository.js';

/**
 * Agregações públicas da vitrine — SQL alinhado a `produtoController.home` / `detail`.
 * Compartilhado entre GET /public/store, /categories, /products.
 */
export async function getPublicCategoriesWithProducts(db: pg.Pool): Promise<PublicCategory[]> {
  return findPublicCategoriesWithProducts(db);
}

export async function listPublicProducts(db: TenantDatabase): Promise<PublicProduct[]> {
  return findAllPublicProducts(db);
}

export async function getPublicStore(db: pg.Pool): Promise<PublicStoreData> {
  const [configs, categorias, produtos_sem_categoria] = await Promise.all([
    findStoreConfigs(db),
    findPublicCategoriesWithProducts(db),
    findPublicProductsWithoutCategory(db),
  ]);

  return {
    ...configs,
    categorias,
    produtos_sem_categoria,
  };
}

export async function getPublicProductById(
  db: TenantDatabase,
  id: number,
): Promise<PublicProductDetail | null> {
  return findPublicProductById(db, id);
}

export async function listPublicBanners(db: pg.Pool): Promise<PublicBanner[]> {
  return findPublicBanners(db);
}
