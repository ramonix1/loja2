import type {
  PublicBanner,
  PublicCategory,
  PublicProduct,
  PublicProductDetail,
  PublicStoreData,
} from '@lojao/types/public-store';
import { DEFAULT_LOJA_COR_PRIMARIA } from '@lojao/types/aparencia';
import { DEFAULT_STORE_THEME } from '@lojao/types/store-theme';

import { settingKeyFromEn } from '../../lib/merchant-schema-map.js';
import type { StoreScope } from '../../lib/store-scope.js';
import {
  getRatingSummariesByProductIds,
  getRatingSummaryForProduct,
} from '../reviews/reviews.service.js';

function toNum(v: string | number | null | undefined): number {
  return Number(v ?? 0);
}

function mapProduct(
  row: Record<string, unknown>,
  ratingMap?: Map<number, { average: number; count: number }>,
): PublicProduct {
  const product: PublicProduct = {
    id: Number(row.id),
    nome: String(row.nome),
    subtitulo: row.subtitulo == null ? null : String(row.subtitulo),
    valor: toNum(row.valor as string | number | null | undefined),
    estoque: row.estoque == null ? null : Number(row.estoque),
    categoria_id: row.categoria_id == null ? null : Number(row.categoria_id),
    primeira_imagem: row.primeira_imagem == null ? null : String(row.primeira_imagem),
  };
  const summary = ratingMap?.get(product.id);
  if (summary) product.rating_summary = summary;
  return product;
}

function attachRatingsToProducts(
  products: PublicProduct[],
  ratingMap: Map<number, { average: number; count: number }>,
): PublicProduct[] {
  return products.map((p) => {
    const summary = ratingMap.get(p.id);
    return summary ? { ...p, rating_summary: summary } : p;
  });
}

/** Configs `store.*` + `inventory.enabled` — espelha legacy `getConfigs`. */
async function getStoreConfigs({ pool, storeId }: StoreScope): Promise<{
  loja: PublicStoreData['loja'];
  controla_estoque: boolean;
}> {
  const result = await pool.query(
    `SELECT key, value FROM store_settings
     WHERE store_id = $1 AND (key LIKE 'store.%' OR key = 'inventory.enabled')`,
    [storeId],
  );

  const cfg: Record<string, string> = {};
  for (const row of result.rows as { key: string; value: string | null }[]) {
    cfg[settingKeyFromEn(row.key)] = row.value ?? '';
  }

  return {
    loja: {
      nome: cfg.loja_nome || 'Ata Commerce Demo',
      cor_primaria: cfg.loja_cor_primaria || DEFAULT_LOJA_COR_PRIMARIA,
      tema: DEFAULT_STORE_THEME,
      logo: cfg.loja_logo ?? '',
      slogan: cfg.loja_slogan ?? '',
      favicon: cfg.loja_favicon || undefined,
    },
    controla_estoque: cfg.controla_estoque === 'true',
  };
}

const PRODUCT_FIELDS = `
  p.id, p.name AS nome, p.subtitle AS subtitulo, p.price AS valor, p.stock AS estoque,
  p.category_id AS categoria_id,
  (SELECT pi.url FROM product_images pi
   WHERE pi.product_id = p.id AND pi.store_id = p.store_id
   ORDER BY pi.id ASC LIMIT 1) AS primeira_imagem
`;

/**
 * Agregações públicas da vitrine — SQL alinhado a `produtoController.home` / `detail`.
 * Compartilhado entre GET /public/store, /categories, /products.
 */
export async function getPublicCategoriesWithProducts(
  scope: StoreScope,
): Promise<PublicCategory[]> {
  const res = await scope.pool
    .query(
      `
      SELECT c.id AS cat_id, c.name AS cat_nome, c."order" AS cat_ordem,
             ${PRODUCT_FIELDS}
      FROM categories c
      JOIN products p ON p.category_id = c.id AND p.store_id = c.store_id
      WHERE c.store_id = $1 AND c.active = true
      ORDER BY c."order" ASC, c.name ASC, p.created_at DESC
    `,
      [scope.storeId],
    )
    .catch(() => ({ rows: [] }));

  const categoriaMap = new Map<number, PublicCategory>();
  for (const row of res.rows as Record<string, unknown>[]) {
    const catId = Number(row.cat_id);
    if (!categoriaMap.has(catId)) {
      categoriaMap.set(catId, {
        id: catId,
        nome: String(row.cat_nome),
        ordem: Number(row.cat_ordem ?? 0),
        produtos: [],
      });
    }
    categoriaMap.get(catId)!.produtos.push(mapProduct(row));
  }

  const categorias = [...categoriaMap.values()];
  const productIds = categorias.flatMap((c) => c.produtos.map((p) => p.id));
  const ratingMap = await getRatingSummariesByProductIds(scope, productIds);

  return categorias.map((cat) => ({
    ...cat,
    produtos: attachRatingsToProducts(cat.produtos, ratingMap),
  }));
}

export async function getPublicProductsWithoutCategory(scope: StoreScope): Promise<PublicProduct[]> {
  const res = await scope.pool.query(
    `
    SELECT ${PRODUCT_FIELDS}
    FROM products p
    WHERE p.store_id = $1 AND p.category_id IS NULL
    ORDER BY p.created_at DESC
  `,
    [scope.storeId],
  );

  const products = res.rows.map((row) => mapProduct(row as Record<string, unknown>));
  const ratingMap = await getRatingSummariesByProductIds(
    scope,
    products.map((p) => p.id),
  );
  return attachRatingsToProducts(products, ratingMap);
}

export async function listPublicProducts(scope: StoreScope): Promise<PublicProduct[]> {
  const res = await scope.pool.query(
    `
    SELECT ${PRODUCT_FIELDS}
    FROM products p
    WHERE p.store_id = $1
    ORDER BY p.created_at DESC
  `,
    [scope.storeId],
  );

  const products = res.rows.map((row) => mapProduct(row as Record<string, unknown>));
  const ratingMap = await getRatingSummariesByProductIds(
    scope,
    products.map((p) => p.id),
  );
  return attachRatingsToProducts(products, ratingMap);
}

export async function getPublicStore(scope: StoreScope): Promise<PublicStoreData> {
  const [configs, categorias, produtos_sem_categoria] = await Promise.all([
    getStoreConfigs(scope),
    getPublicCategoriesWithProducts(scope),
    getPublicProductsWithoutCategory(scope),
  ]);

  return {
    ...configs,
    categorias,
    produtos_sem_categoria,
  };
}

export async function getPublicProductById(
  scope: StoreScope,
  id: number,
): Promise<PublicProductDetail | null> {
  const produtoRes = await scope.pool.query(
    'SELECT * FROM products WHERE id = $1 AND store_id = $2',
    [id, scope.storeId],
  );
  const row = produtoRes.rows[0] as Record<string, unknown> | undefined;
  if (!row) return null;

  const imagensRes = await scope.pool.query(
    'SELECT id, url FROM product_images WHERE product_id = $1 AND store_id = $2 ORDER BY id ASC',
    [id, scope.storeId],
  );

  const primeira = (imagensRes.rows[0] as { url?: string } | undefined)?.url ?? null;
  const ratingSummary = await getRatingSummaryForProduct(scope, id);

  const detail: PublicProductDetail = {
    id: Number(row.id),
    nome: String(row.name),
    subtitulo: row.subtitle == null ? null : String(row.subtitle),
    valor: toNum(row.price as string | number),
    estoque: row.stock == null ? null : Number(row.stock),
    categoria_id: row.category_id == null ? null : Number(row.category_id),
    primeira_imagem: primeira,
    descricao: row.description == null ? null : String(row.description),
    imagens: imagensRes.rows.map((img: { id: number; url: string }) => ({
      id: img.id,
      url: img.url,
    })),
  };
  if (ratingSummary) detail.rating_summary = ratingSummary;
  return detail;
}

export async function listPublicBanners(scope: StoreScope): Promise<PublicBanner[]> {
  const res = await scope.pool
    .query(
      `SELECT b.id, b.title AS titulo, b.subtitle AS subtitulo, b.image AS imagem,
              b.cta_text AS cta_texto, b.cta_url, b.product_id AS produto_id
       FROM banners b
       WHERE b.store_id = $1 AND b.active = true
       ORDER BY b."order" ASC, b.created_at ASC`,
      [scope.storeId],
    )
    .catch(() => ({ rows: [] }));

  return res.rows.map((r) => ({
    id: Number(r.id),
    titulo: String(r.titulo),
    subtitulo: r.subtitulo == null ? null : String(r.subtitulo),
    imagem: String(r.imagem),
    cta_texto: String(r.cta_texto ?? 'Ver oferta'),
    cta_url: r.cta_url == null ? null : String(r.cta_url),
    produto_id: r.produto_id == null ? null : Number(r.produto_id),
  }));
}
