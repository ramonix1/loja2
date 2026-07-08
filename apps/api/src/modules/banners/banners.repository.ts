import type { BannerDetail, BannerFieldsInput, BannerListItem, ProdutoOption } from '@lojao/types/banners';

import type { StoreScope } from '../../lib/store-scope.js';

function mapRow(row: {
  id: number;
  title: string;
  subtitle: string | null;
  image: string;
  cta_text: string;
  cta_url: string | null;
  product_id: number | null;
  produto_nome?: string | null;
  active: boolean;
  order: number;
  created_at: Date | string;
  updated_at: Date | string;
}): BannerListItem {
  return {
    id: row.id,
    titulo: row.title,
    subtitulo: row.subtitle,
    imagem: row.image,
    cta_texto: row.cta_text,
    cta_url: row.cta_url,
    produto_id: row.product_id,
    produto_nome: row.produto_nome ?? null,
    ativo: row.active,
    ordem: row.order,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

export async function findBanners({ pool, storeId }: StoreScope): Promise<BannerListItem[]> {
  const r = await pool.query(
    `SELECT b.*, p.name AS produto_nome
     FROM banners b
     LEFT JOIN products p ON p.id = b.product_id AND p.store_id = b.store_id
     WHERE b.store_id = $1
     ORDER BY b."order" ASC, b.created_at DESC`,
    [storeId],
  );
  return r.rows.map(mapRow);
}

export async function findBannerById(
  { pool, storeId }: StoreScope,
  id: number,
): Promise<BannerDetail | null> {
  const r = await pool.query('SELECT * FROM banners WHERE id = $1 AND store_id = $2', [id, storeId]);
  if (!r.rows[0]) return null;
  return mapRow(r.rows[0]);
}

export async function findBannerImageUrl(
  { pool, storeId }: StoreScope,
  id: number,
): Promise<string | null> {
  const r = await pool.query('SELECT image FROM banners WHERE id = $1 AND store_id = $2', [
    id,
    storeId,
  ]);
  return (r.rows[0]?.image as string | null) ?? null;
}

export async function findProdutoOptions({ pool, storeId }: StoreScope): Promise<ProdutoOption[]> {
  const r = await pool.query(
    'SELECT id, name AS nome FROM products WHERE store_id = $1 ORDER BY name ASC',
    [storeId],
  );
  return r.rows;
}

export async function insertBanner(
  { pool, storeId }: StoreScope,
  input: BannerFieldsInput,
  imagemUrl: string,
): Promise<{ id: number }> {
  const produtoId = input.produto_id ?? null;
  const ctaUrl = input.cta_url?.trim() || null;

  const r = await pool.query(
    `INSERT INTO banners (store_id, title, subtitle, image, cta_text, cta_url, product_id, active, "order")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [
      storeId,
      input.titulo,
      input.subtitulo ?? null,
      imagemUrl,
      input.cta_texto || 'Ver oferta',
      ctaUrl,
      produtoId,
      input.ativo,
      input.ordem,
    ],
  );
  return { id: r.rows[0].id as number };
}

export async function updateBannerRecord(
  { pool, storeId }: StoreScope,
  id: number,
  input: BannerFieldsInput,
  imagemUrl?: string,
): Promise<boolean> {
  const produtoId = input.produto_id ?? null;
  const ctaUrl = input.cta_url?.trim() || null;

  if (imagemUrl) {
    await pool.query(
      `UPDATE banners SET title=$1, subtitle=$2, image=$3, cta_text=$4, cta_url=$5,
       product_id=$6, active=$7, "order"=$8, updated_at=NOW() WHERE id=$9 AND store_id=$10`,
      [
        input.titulo,
        input.subtitulo ?? null,
        imagemUrl,
        input.cta_texto || 'Ver oferta',
        ctaUrl,
        produtoId,
        input.ativo,
        input.ordem,
        id,
        storeId,
      ],
    );
  } else {
    await pool.query(
      `UPDATE banners SET title=$1, subtitle=$2, cta_text=$3, cta_url=$4,
       product_id=$5, active=$6, "order"=$7, updated_at=NOW() WHERE id=$8 AND store_id=$9`,
      [
        input.titulo,
        input.subtitulo ?? null,
        input.cta_texto || 'Ver oferta',
        ctaUrl,
        produtoId,
        input.ativo,
        input.ordem,
        id,
        storeId,
      ],
    );
  }

  return true;
}

export async function deleteBannerRecord(
  { pool, storeId }: StoreScope,
  id: number,
): Promise<void> {
  await pool.query('DELETE FROM banners WHERE id = $1 AND store_id = $2', [id, storeId]);
}

export async function toggleBannerAtivoRecord(
  { pool, storeId }: StoreScope,
  id: number,
): Promise<boolean> {
  const r = await pool.query(
    'UPDATE banners SET active = NOT active, updated_at = NOW() WHERE id = $1 AND store_id = $2 RETURNING id',
    [id, storeId],
  );
  return r.rowCount !== null && r.rowCount > 0;
}
