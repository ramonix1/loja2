import type { BannerDetail, BannerFieldsInput, BannerListItem, ProdutoOption } from '@lojao/types/banners';
import type pg from 'pg';

import type { ImageStorage } from '../../ports/image-storage.js';

function mapRow(row: {
  id: number;
  titulo: string;
  subtitulo: string | null;
  imagem: string;
  cta_texto: string;
  cta_url: string | null;
  produto_id: number | null;
  produto_nome?: string | null;
  ativo: boolean;
  ordem: number;
  created_at: Date | string;
  updated_at: Date | string;
}): BannerListItem {
  return {
    id: row.id,
    titulo: row.titulo,
    subtitulo: row.subtitulo,
    imagem: row.imagem,
    cta_texto: row.cta_texto,
    cta_url: row.cta_url,
    produto_id: row.produto_id,
    produto_nome: row.produto_nome ?? null,
    ativo: row.ativo,
    ordem: row.ordem,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

export async function listBanners(db: pg.Pool): Promise<BannerListItem[]> {
  const r = await db.query(`
    SELECT b.*, p.nome AS produto_nome
    FROM banners b
    LEFT JOIN produtos p ON p.id = b.produto_id
    ORDER BY b.ordem ASC, b.created_at DESC
  `);
  return r.rows.map(mapRow);
}

export async function getBanner(db: pg.Pool, id: number): Promise<BannerDetail | null> {
  const r = await db.query('SELECT * FROM banners WHERE id = $1', [id]);
  if (!r.rows[0]) return null;
  return mapRow(r.rows[0]);
}

export async function listProdutoOptions(db: pg.Pool): Promise<ProdutoOption[]> {
  const r = await db.query('SELECT id, nome FROM produtos ORDER BY nome ASC');
  return r.rows;
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

  const r = await db.query(
    `INSERT INTO banners (titulo, subtitulo, imagem, cta_texto, cta_url, produto_id, ativo, ordem)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [
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

export async function updateBanner(
  db: pg.Pool,
  storage: ImageStorage,
  id: number,
  input: BannerFieldsInput,
  image?: { buffer: Buffer; mimetype: string; filename: string } | null,
): Promise<boolean> {
  const existing = await db.query('SELECT imagem FROM banners WHERE id = $1', [id]);
  if (!existing.rows[0]) return false;

  const produtoId = input.produto_id ?? null;
  const ctaUrl = input.cta_url?.trim() || null;

  if (image) {
    await storage.delete(existing.rows[0].imagem as string);
    const imagemUrl = await storage.save({
      buffer: image.buffer,
      originalFilename: image.filename,
      mimetype: image.mimetype,
    });
    await db.query(
      `UPDATE banners SET titulo=$1, subtitulo=$2, imagem=$3, cta_texto=$4, cta_url=$5,
       produto_id=$6, ativo=$7, ordem=$8, updated_at=NOW() WHERE id=$9`,
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
      ],
    );
  } else {
    await db.query(
      `UPDATE banners SET titulo=$1, subtitulo=$2, cta_texto=$3, cta_url=$4,
       produto_id=$5, ativo=$6, ordem=$7, updated_at=NOW() WHERE id=$8`,
      [
        input.titulo,
        input.subtitulo ?? null,
        input.cta_texto || 'Ver oferta',
        ctaUrl,
        produtoId,
        input.ativo,
        input.ordem,
        id,
      ],
    );
  }

  return true;
}

export async function deleteBanner(
  db: pg.Pool,
  storage: ImageStorage,
  id: number,
): Promise<boolean> {
  const r = await db.query('SELECT imagem FROM banners WHERE id = $1', [id]);
  if (!r.rows[0]) return false;

  await storage.delete(r.rows[0].imagem as string);
  await db.query('DELETE FROM banners WHERE id = $1', [id]);
  return true;
}

export async function toggleBannerAtivo(db: pg.Pool, id: number): Promise<boolean> {
  const r = await db.query(
    'UPDATE banners SET ativo = NOT ativo, updated_at = NOW() WHERE id = $1 RETURNING id',
    [id],
  );
  return r.rowCount !== null && r.rowCount > 0;
}
