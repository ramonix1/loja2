import type {
  CategoriaDetail,
  CategoriaListItem,
  CreateCategoriaInput,
  UpdateCategoriaInput,
} from '@lojao/types/categorias';

import type { StoreScope } from '../../lib/store-scope.js';

function mapListRow(row: {
  id: number;
  name: string;
  order: number;
  active: boolean;
  total_produtos: string | number;
  created_at: Date | string;
  updated_at: Date | string;
}): CategoriaListItem {
  return {
    id: row.id,
    nome: row.name,
    ordem: row.order,
    ativo: row.active,
    total_produtos: Number(row.total_produtos),
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

export async function findCategorias({ pool, storeId }: StoreScope): Promise<CategoriaListItem[]> {
  const r = await pool.query(
    `SELECT c.*, COUNT(p.id)::int AS total_produtos
     FROM categories c
     LEFT JOIN products p ON p.category_id = c.id AND p.store_id = c.store_id
     WHERE c.store_id = $1
     GROUP BY c.id
     ORDER BY c."order" ASC, c.name ASC`,
    [storeId],
  );
  return r.rows.map(mapListRow);
}

export async function findCategoriaById(
  { pool, storeId }: StoreScope,
  id: number,
): Promise<CategoriaDetail | null> {
  const catRes = await pool.query('SELECT * FROM categories WHERE id = $1 AND store_id = $2', [
    id,
    storeId,
  ]);
  if (!catRes.rows[0]) return null;

  const produtosRes = await pool.query(
    'SELECT id, name AS nome, category_id AS categoria_id FROM products WHERE store_id = $1 ORDER BY name ASC',
    [storeId],
  );

  const row = catRes.rows[0];
  return {
    id: row.id,
    nome: row.name,
    ordem: row.order,
    ativo: row.active,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
    produtos: produtosRes.rows.map((p: { id: number; nome: string; categoria_id: number | null }) => ({
      id: p.id,
      nome: p.nome,
      categoria_id: p.categoria_id,
    })),
  };
}

export async function existsCategoria({ pool, storeId }: StoreScope, id: number): Promise<boolean> {
  const r = await pool.query('SELECT id FROM categories WHERE id = $1 AND store_id = $2', [
    id,
    storeId,
  ]);
  return !!r.rows[0];
}

export async function insertCategoria(
  { pool, storeId }: StoreScope,
  input: CreateCategoriaInput,
): Promise<{ id: number }> {
  const r = await pool.query(
    'INSERT INTO categories (store_id, name) VALUES ($1, $2) RETURNING id',
    [storeId, input.nome.trim()],
  );
  return { id: r.rows[0].id as number };
}

export async function updateCategoriaRecord(
  { pool, storeId }: StoreScope,
  id: number,
  input: UpdateCategoriaInput,
): Promise<void> {
  await pool.query(
    'UPDATE categories SET name = $1, "order" = $2, updated_at = NOW() WHERE id = $3 AND store_id = $4',
    [input.nome.trim(), input.ordem, id, storeId],
  );
  await pool.query(
    'UPDATE products SET category_id = NULL WHERE category_id = $1 AND store_id = $2',
    [id, storeId],
  );
  if (input.produtos_ids.length > 0) {
    await pool.query(
      'UPDATE products SET category_id = $1 WHERE id = ANY($2::int[]) AND store_id = $3',
      [id, input.produtos_ids, storeId],
    );
  }
}

export async function deleteCategoriaRecord(
  { pool, storeId }: StoreScope,
  id: number,
): Promise<void> {
  await pool.query(
    'UPDATE products SET category_id = NULL WHERE category_id = $1 AND store_id = $2',
    [id, storeId],
  );
  await pool.query('DELETE FROM categories WHERE id = $1 AND store_id = $2', [id, storeId]);
}
