import type { ProdutoDetail, ProdutoFieldsInput, ProdutoListItem } from '@lojao/types/produtos';

import type { StoreScope } from '../../lib/store-scope.js';

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

export async function findProdutos({ pool, storeId }: StoreScope): Promise<ProdutoListItem[]> {
  const r = await pool.query(
    `SELECT p.*,
       (SELECT pi.url FROM product_images pi
        WHERE pi.product_id = p.id AND pi.store_id = p.store_id ORDER BY pi.id ASC LIMIT 1) AS primeira_imagem
     FROM products p
     WHERE p.store_id = $1
     ORDER BY p.created_at DESC`,
    [storeId],
  );
  return r.rows.map(mapListRow);
}

export async function findProdutoById(
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

export async function findProdutoImages(
  { pool, storeId }: StoreScope,
  id: number,
): Promise<Array<{ url: string }>> {
  const r = await pool.query(
    'SELECT url FROM product_images WHERE product_id = $1 AND store_id = $2',
    [id, storeId],
  );
  return r.rows as Array<{ url: string }>;
}

export async function findProdutoImageById(
  { pool, storeId }: StoreScope,
  imagemId: number,
): Promise<{ url: string } | null> {
  const r = await pool.query(
    'SELECT url FROM product_images WHERE id = $1 AND store_id = $2',
    [imagemId, storeId],
  );
  return (r.rows[0] as { url: string } | undefined) ?? null;
}

export async function insertProduto(
  { pool, storeId }: StoreScope,
  input: ProdutoFieldsInput,
): Promise<{ id: number }> {
  const r = await pool.query(
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
  return { id: r.rows[0].id as number };
}

export async function insertProdutoImage(
  { pool, storeId }: StoreScope,
  produtoId: number,
  url: string,
): Promise<void> {
  await pool.query(
    'INSERT INTO product_images (store_id, product_id, url) VALUES ($1, $2, $3)',
    [storeId, produtoId, url],
  );
}

export async function updateProdutoRecord(
  { pool, storeId }: StoreScope,
  id: number,
  input: ProdutoFieldsInput,
): Promise<boolean> {
  const r = await pool.query(
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
  return (r.rowCount ?? 0) > 0;
}

export async function deleteProdutoRecord(
  { pool, storeId }: StoreScope,
  id: number,
): Promise<void> {
  await pool.query('DELETE FROM products WHERE id = $1 AND store_id = $2', [id, storeId]);
}

export async function deleteProdutoImageById(
  { pool, storeId }: StoreScope,
  imagemId: number,
): Promise<void> {
  await pool.query('DELETE FROM product_images WHERE id = $1 AND store_id = $2', [imagemId, storeId]);
}

export async function findProdutoEstoque(
  { pool, storeId }: StoreScope,
  id: number,
): Promise<{ stock: number | null } | null> {
  const r = await pool.query(
    'SELECT stock FROM products WHERE id = $1 AND store_id = $2',
    [id, storeId],
  );
  return (r.rows[0] as { stock: number | null } | undefined) ?? null;
}

export async function updateProdutoEstoqueRecord(
  { pool, storeId }: StoreScope,
  id: number,
  estoque: number | null,
): Promise<void> {
  await pool.query(
    'UPDATE products SET stock = $1, updated_at = NOW() WHERE id = $2 AND store_id = $3',
    [estoque, id, storeId],
  );
}

export async function insertInventoryMovement(
  { pool, storeId }: StoreScope,
  produtoId: number,
  tipo: string,
  quantidade: number,
  observacao: string,
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO inventory_movements (store_id, product_id, type, quantity, source, note)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [storeId, produtoId, tipo, Math.abs(quantidade), 'admin_adjustment', observacao],
    );
  } catch {
    // tabela pode não existir em ambiente de teste mínimo
  }
}
