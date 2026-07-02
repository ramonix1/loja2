import type { ProdutoDetail, ProdutoFieldsInput, ProdutoListItem } from '@lojao/types/produtos';

import type { StoreScope } from '../../lib/store-scope.js';
import type { ImageStorage } from '../../ports/image-storage.js';

function mapListRow(row: {
  id: number;
  name: string;
  subtitle: string | null;
  price: string | number;
  description: string | null;
  stock: number | null;
  category_id: number | null;
  primeira_imagem: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}): ProdutoListItem {
  return {
    id: row.id,
    nome: row.name,
    subtitulo: row.subtitle,
    valor: Number(row.price),
    descricao: row.description,
    estoque: row.stock,
    categoria_id: row.category_id,
    primeira_imagem: row.primeira_imagem,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

export async function listProdutos({ pool, storeId }: StoreScope): Promise<ProdutoListItem[]> {
  const r = await pool.query(
    `
    SELECT p.*,
      (SELECT pi.url FROM product_images pi
       WHERE pi.product_id = p.id AND pi.store_id = p.store_id ORDER BY pi.id ASC LIMIT 1) AS primeira_imagem
    FROM products p
    WHERE p.store_id = $1
    ORDER BY p.created_at DESC
  `,
    [storeId],
  );
  return r.rows.map(mapListRow);
}

export async function getProduto(
  { pool, storeId }: StoreScope,
  id: number,
): Promise<ProdutoDetail | null> {
  const produtoRes = await pool.query(
    'SELECT * FROM products WHERE id = $1 AND store_id = $2',
    [id, storeId],
  );
  if (!produtoRes.rows[0]) return null;

  const imagensRes = await pool.query(
    'SELECT id, url FROM product_images WHERE product_id = $1 AND store_id = $2 ORDER BY id ASC',
    [id, storeId],
  );

  const row = produtoRes.rows[0];
  return {
    ...mapListRow({ ...row, primeira_imagem: imagensRes.rows[0]?.url ?? null }),
    imagens: imagensRes.rows,
  };
}

export async function createProduto(
  { pool, storeId }: StoreScope,
  storage: ImageStorage,
  input: ProdutoFieldsInput,
  images: Array<{ buffer: Buffer; mimetype: string; filename: string }>,
): Promise<{ id: number }> {
  const ins = await pool.query(
    `INSERT INTO products (store_id, name, subtitle, price, description, stock, category_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [
      storeId,
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
    await pool.query(
      'INSERT INTO product_images (store_id, product_id, url) VALUES ($1, $2, $3)',
      [storeId, id, url],
    );
  }

  return { id };
}

export async function updateProduto(
  { pool, storeId }: StoreScope,
  storage: ImageStorage,
  id: number,
  input: ProdutoFieldsInput,
  images: Array<{ buffer: Buffer; mimetype: string; filename: string }>,
): Promise<boolean> {
  const upd = await pool.query(
    `UPDATE products
     SET name=$1, subtitle=$2, price=$3, description=$4, stock=$5, category_id=$6, updated_at=NOW()
     WHERE id=$7 AND store_id=$8`,
    [
      input.nome,
      input.subtitulo ?? null,
      input.valor,
      input.descricao ?? null,
      input.estoque ?? null,
      input.categoria_id ?? null,
      id,
      storeId,
    ],
  );
  if ((upd.rowCount ?? 0) === 0) return false;

  for (const file of images) {
    const url = await storage.save({
      buffer: file.buffer,
      originalFilename: file.filename,
      mimetype: file.mimetype,
    });
    await pool.query(
      'INSERT INTO product_images (store_id, product_id, url) VALUES ($1, $2, $3)',
      [storeId, id, url],
    );
  }

  return true;
}

export async function deleteProduto(
  { pool, storeId }: StoreScope,
  storage: ImageStorage,
  id: number,
): Promise<boolean> {
  const imagens = await pool.query(
    'SELECT url FROM product_images WHERE product_id = $1 AND store_id = $2',
    [id, storeId],
  );
  for (const img of imagens.rows as { url: string }[]) {
    await storage.delete(img.url);
  }
  const del = await pool.query('DELETE FROM products WHERE id = $1 AND store_id = $2', [id, storeId]);
  return (del.rowCount ?? 0) > 0;
}

export async function deleteProdutoImagem(
  { pool, storeId }: StoreScope,
  storage: ImageStorage,
  imagemId: number,
): Promise<boolean> {
  const img = await pool.query(
    'SELECT url FROM product_images WHERE id = $1 AND store_id = $2',
    [imagemId, storeId],
  );
  if (!img.rows[0]) return false;
  await storage.delete(img.rows[0].url as string);
  await pool.query('DELETE FROM product_images WHERE id = $1 AND store_id = $2', [imagemId, storeId]);
  return true;
}

export async function updateProdutoEstoque(
  { pool, storeId }: StoreScope,
  id: number,
  estoque: number | null,
  observacao?: string,
): Promise<boolean> {
  const anteriorRes = await pool.query(
    'SELECT stock FROM products WHERE id = $1 AND store_id = $2',
    [id, storeId],
  );
  if (!anteriorRes.rows[0]) return false;

  const estoqueAnterior = anteriorRes.rows[0].stock as number | null;
  await pool.query(
    'UPDATE products SET stock = $1, updated_at = NOW() WHERE id = $2 AND store_id = $3',
    [estoque, id, storeId],
  );

  if (estoque !== null) {
    const diff = estoqueAnterior !== null ? estoque - estoqueAnterior : estoque;
    const tipo = diff >= 0 ? 'adjustment' : 'outbound';
    try {
      await pool.query(
        `INSERT INTO inventory_movements (store_id, product_id, type, quantity, source, note)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [storeId, id, tipo, Math.abs(diff), 'admin_adjustment', observacao || 'Ajuste manual'],
      );
    } catch {
      // tabela pode não existir em ambiente de teste mínimo
    }
  }

  return true;
}
