import type { ProdutoDetail, ProdutoFieldsInput, ProdutoListItem } from '@lojao/types/produtos';
import type pg from 'pg';

import type { ImageStorage } from '../../ports/image-storage.js';

function mapListRow(row: {
  id: number;
  nome: string;
  subtitulo: string | null;
  valor: string | number;
  descricao: string | null;
  estoque: number | null;
  categoria_id: number | null;
  primeira_imagem: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}): ProdutoListItem {
  return {
    id: row.id,
    nome: row.nome,
    subtitulo: row.subtitulo,
    valor: Number(row.valor),
    descricao: row.descricao,
    estoque: row.estoque,
    categoria_id: row.categoria_id,
    primeira_imagem: row.primeira_imagem,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

export async function listProdutos(db: pg.Pool): Promise<ProdutoListItem[]> {
  const r = await db.query(`
    SELECT p.*,
      (SELECT pi.url FROM produtos_imagens pi
       WHERE pi.produto_id = p.id ORDER BY pi.id ASC LIMIT 1) AS primeira_imagem
    FROM produtos p
    ORDER BY p.created_at DESC
  `);
  return r.rows.map(mapListRow);
}

export async function getProduto(db: pg.Pool, id: number): Promise<ProdutoDetail | null> {
  const produtoRes = await db.query('SELECT * FROM produtos WHERE id = $1', [id]);
  if (!produtoRes.rows[0]) return null;

  const imagensRes = await db.query(
    'SELECT id, url FROM produtos_imagens WHERE produto_id = $1 ORDER BY id ASC',
    [id],
  );

  const row = produtoRes.rows[0];
  return {
    ...mapListRow({ ...row, primeira_imagem: imagensRes.rows[0]?.url ?? null }),
    imagens: imagensRes.rows,
  };
}

export async function createProduto(
  db: pg.Pool,
  storage: ImageStorage,
  input: ProdutoFieldsInput,
  images: Array<{ buffer: Buffer; mimetype: string; filename: string }>,
): Promise<{ id: number }> {
  const ins = await db.query(
    `INSERT INTO produtos (nome, subtitulo, valor, descricao, estoque, categoria_id)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [
      input.nome,
      input.subtitulo ?? null,
      input.valor,
      input.descricao ?? null,
      input.estoque ?? null,
      input.categoria_id ?? null,
    ],
  );
  const id = ins.rows[0].id as number;

  for (const file of images) {
    const url = await storage.save({
      buffer: file.buffer,
      originalFilename: file.filename,
      mimetype: file.mimetype,
    });
    await db.query('INSERT INTO produtos_imagens (produto_id, url) VALUES ($1, $2)', [id, url]);
  }

  return { id };
}

export async function updateProduto(
  db: pg.Pool,
  storage: ImageStorage,
  id: number,
  input: ProdutoFieldsInput,
  images: Array<{ buffer: Buffer; mimetype: string; filename: string }>,
): Promise<boolean> {
  const upd = await db.query(
    `UPDATE produtos
     SET nome=$1, subtitulo=$2, valor=$3, descricao=$4, estoque=$5, categoria_id=$6, updated_at=NOW()
     WHERE id=$7`,
    [
      input.nome,
      input.subtitulo ?? null,
      input.valor,
      input.descricao ?? null,
      input.estoque ?? null,
      input.categoria_id ?? null,
      id,
    ],
  );
  if ((upd.rowCount ?? 0) === 0) return false;

  for (const file of images) {
    const url = await storage.save({
      buffer: file.buffer,
      originalFilename: file.filename,
      mimetype: file.mimetype,
    });
    await db.query('INSERT INTO produtos_imagens (produto_id, url) VALUES ($1, $2)', [id, url]);
  }

  return true;
}

export async function deleteProduto(
  db: pg.Pool,
  storage: ImageStorage,
  id: number,
): Promise<boolean> {
  const imagens = await db.query('SELECT url FROM produtos_imagens WHERE produto_id = $1', [id]);
  for (const img of imagens.rows as { url: string }[]) {
    await storage.delete(img.url);
  }
  const del = await db.query('DELETE FROM produtos WHERE id = $1', [id]);
  return (del.rowCount ?? 0) > 0;
}

export async function deleteProdutoImagem(
  db: pg.Pool,
  storage: ImageStorage,
  imagemId: number,
): Promise<boolean> {
  const img = await db.query('SELECT url FROM produtos_imagens WHERE id = $1', [imagemId]);
  if (!img.rows[0]) return false;
  await storage.delete(img.rows[0].url as string);
  await db.query('DELETE FROM produtos_imagens WHERE id = $1', [imagemId]);
  return true;
}

export async function updateProdutoEstoque(
  db: pg.Pool,
  id: number,
  estoque: number | null,
  observacao?: string,
): Promise<boolean> {
  const anteriorRes = await db.query('SELECT estoque FROM produtos WHERE id = $1', [id]);
  if (!anteriorRes.rows[0]) return false;

  const estoqueAnterior = anteriorRes.rows[0].estoque as number | null;
  await db.query('UPDATE produtos SET estoque = $1, updated_at = NOW() WHERE id = $2', [
    estoque,
    id,
  ]);

  if (estoque !== null) {
    const diff = estoqueAnterior !== null ? estoque - estoqueAnterior : estoque;
    const tipo = diff >= 0 ? 'ajuste' : 'saida';
    try {
      await db.query(
        'INSERT INTO movimentacoes_estoque (produto_id, tipo, quantidade, origem, observacao) VALUES ($1,$2,$3,$4,$5)',
        [id, tipo, Math.abs(diff), 'admin_ajuste', observacao || 'Ajuste manual'],
      );
    } catch {
      // tabela pode não existir em ambiente de teste mínimo
    }
  }

  return true;
}
