import type { BannerDetail, BannerListItem, ProdutoOption } from '@lojao/types/banners';
import type pg from 'pg';

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

export async function findAllBanners(db: pg.Pool): Promise<BannerListItem[]> {
  const r = await db.query(`
    SELECT b.*, p.nome AS produto_nome
    FROM banners b
    LEFT JOIN produtos p ON p.id = b.produto_id
    ORDER BY b.ordem ASC, b.created_at DESC
  `);
  return r.rows.map(mapRow);
}

export async function findBannerById(db: pg.Pool, id: number): Promise<BannerDetail | null> {
  const r = await db.query('SELECT * FROM banners WHERE id = $1', [id]);
  if (!r.rows[0]) return null;
  return mapRow(r.rows[0]);
}

export async function findProdutoOptions(db: pg.Pool): Promise<ProdutoOption[]> {
  const r = await db.query('SELECT id, nome FROM produtos ORDER BY nome ASC');
  return r.rows;
}

export async function findBannerImage(db: pg.Pool, id: number): Promise<string | null> {
  const r = await db.query('SELECT imagem FROM banners WHERE id = $1', [id]);
  if (!r.rows[0]) return null;
  return r.rows[0].imagem as string;
}

export async function insertBanner(
  db: pg.Pool,
  input: {
    titulo: string;
    subtitulo: string | null;
    imagemUrl: string;
    cta_texto: string;
    cta_url: string | null;
    produto_id: number | null;
    ativo: boolean;
    ordem: number;
  },
): Promise<{ id: number }> {
  const r = await db.query(
    `INSERT INTO banners (titulo, subtitulo, imagem, cta_texto, cta_url, produto_id, ativo, ordem)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [
      input.titulo,
      input.subtitulo,
      input.imagemUrl,
      input.cta_texto,
      input.cta_url,
      input.produto_id,
      input.ativo,
      input.ordem,
    ],
  );
  return { id: r.rows[0].id as number };
}

export async function updateBannerWithImage(
  db: pg.Pool,
  id: number,
  input: {
    titulo: string;
    subtitulo: string | null;
    imagemUrl: string;
    cta_texto: string;
    cta_url: string | null;
    produto_id: number | null;
    ativo: boolean;
    ordem: number;
  },
): Promise<void> {
  await db.query(
    `UPDATE banners SET titulo=$1, subtitulo=$2, imagem=$3, cta_texto=$4, cta_url=$5,
     produto_id=$6, ativo=$7, ordem=$8, updated_at=NOW() WHERE id=$9`,
    [
      input.titulo,
      input.subtitulo,
      input.imagemUrl,
      input.cta_texto,
      input.cta_url,
      input.produto_id,
      input.ativo,
      input.ordem,
      id,
    ],
  );
}

export async function updateBannerWithoutImage(
  db: pg.Pool,
  id: number,
  input: {
    titulo: string;
    subtitulo: string | null;
    cta_texto: string;
    cta_url: string | null;
    produto_id: number | null;
    ativo: boolean;
    ordem: number;
  },
): Promise<void> {
  await db.query(
    `UPDATE banners SET titulo=$1, subtitulo=$2, cta_texto=$3, cta_url=$4,
     produto_id=$5, ativo=$6, ordem=$7, updated_at=NOW() WHERE id=$8`,
    [
      input.titulo,
      input.subtitulo,
      input.cta_texto,
      input.cta_url,
      input.produto_id,
      input.ativo,
      input.ordem,
      id,
    ],
  );
}

export async function deleteBannerById(db: pg.Pool, id: number): Promise<boolean> {
  const r = await db.query('DELETE FROM banners WHERE id = $1', [id]);
  return r.rowCount !== null && r.rowCount > 0;
}

export async function toggleBannerAtivoRecord(db: pg.Pool, id: number): Promise<boolean> {
  const r = await db.query(
    'UPDATE banners SET ativo = NOT ativo, updated_at = NOW() WHERE id = $1 RETURNING id',
    [id],
  );
  return r.rowCount !== null && r.rowCount > 0;
}
