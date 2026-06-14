import type pg from 'pg';

import type {
  CategoriaDetail,
  CategoriaListItem,
  CreateCategoriaInput,
  UpdateCategoriaInput,
} from '@lojao/types/categorias';

function mapListRow(row: {
  id: number;
  nome: string;
  ordem: number;
  ativo: boolean;
  total_produtos: string | number;
  created_at: Date | string;
  updated_at: Date | string;
}): CategoriaListItem {
  return {
    id: row.id,
    nome: row.nome,
    ordem: row.ordem,
    ativo: row.ativo,
    total_produtos: Number(row.total_produtos),
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

export async function listCategorias(db: pg.Pool): Promise<CategoriaListItem[]> {
  const r = await db.query(`
    SELECT c.*, COUNT(p.id)::int AS total_produtos
    FROM categorias c
    LEFT JOIN produtos p ON p.categoria_id = c.id
    GROUP BY c.id
    ORDER BY c.ordem ASC, c.nome ASC
  `);
  return r.rows.map(mapListRow);
}

export async function getCategoria(db: pg.Pool, id: number): Promise<CategoriaDetail | null> {
  const catRes = await db.query('SELECT * FROM categorias WHERE id = $1', [id]);
  if (!catRes.rows[0]) return null;

  const produtosRes = await db.query(
    'SELECT id, nome, categoria_id FROM produtos ORDER BY nome ASC',
  );

  const row = catRes.rows[0];
  return {
    id: row.id,
    nome: row.nome,
    ordem: row.ordem,
    ativo: row.ativo,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
    produtos: produtosRes.rows.map((p: { id: number; nome: string; categoria_id: number | null }) => ({
      id: p.id,
      nome: p.nome,
      categoria_id: p.categoria_id,
    })),
  };
}

export async function createCategoria(
  db: pg.Pool,
  input: CreateCategoriaInput,
): Promise<{ id: number }> {
  const r = await db.query(
    'INSERT INTO categorias (nome) VALUES ($1) RETURNING id',
    [input.nome.trim()],
  );
  return { id: r.rows[0].id as number };
}

/** Porta `categoriaController.atualizar` — atualiza nome/ordem e reassocia produtos. */
export async function updateCategoria(
  db: pg.Pool,
  id: number,
  input: UpdateCategoriaInput,
): Promise<boolean> {
  const exists = await db.query('SELECT id FROM categorias WHERE id = $1', [id]);
  if (!exists.rows[0]) return false;

  await db.query(
    'UPDATE categorias SET nome = $1, ordem = $2, updated_at = NOW() WHERE id = $3',
    [input.nome.trim(), input.ordem, id],
  );
  await db.query('UPDATE produtos SET categoria_id = NULL WHERE categoria_id = $1', [id]);

  if (input.produtos_ids.length > 0) {
    await db.query('UPDATE produtos SET categoria_id = $1 WHERE id = ANY($2::int[])', [
      id,
      input.produtos_ids,
    ]);
  }

  return true;
}

/** Porta `categoriaController.remover` — desvincula produtos e exclui categoria. */
export async function deleteCategoria(db: pg.Pool, id: number): Promise<boolean> {
  const exists = await db.query('SELECT id FROM categorias WHERE id = $1', [id]);
  if (!exists.rows[0]) return false;

  await db.query('UPDATE produtos SET categoria_id = NULL WHERE categoria_id = $1', [id]);
  await db.query('DELETE FROM categorias WHERE id = $1', [id]);
  return true;
}
