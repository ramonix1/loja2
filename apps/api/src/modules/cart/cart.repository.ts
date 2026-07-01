import type pg from 'pg';

export async function findCartItems(
  db: pg.Pool,
  usuarioId: number,
): Promise<Array<Record<string, unknown>>> {
  const r = await db.query(
    `SELECT
       ci.id, ci.quantidade, ci.preco_unitario,
       ci.preco_unitario * ci.quantidade AS subtotal,
       p.id AS produto_id, p.nome, p.subtitulo,
       (SELECT url FROM produtos_imagens WHERE produto_id = p.id ORDER BY id LIMIT 1) AS imagem
     FROM carrinho_itens ci
     JOIN produtos p ON p.id = ci.produto_id
     WHERE ci.usuario_id = $1
     ORDER BY ci.created_at ASC`,
    [usuarioId],
  );
  return r.rows;
}

export async function sumCartQuantities(db: pg.Pool, usuarioId: number): Promise<number> {
  const r = await db.query(
    'SELECT COALESCE(SUM(quantidade), 0) AS total FROM carrinho_itens WHERE usuario_id = $1',
    [usuarioId],
  );
  return parseInt(String(r.rows[0]?.total ?? 0), 10);
}

export async function findProductById(
  db: pg.Pool,
  produtoId: number,
): Promise<{ id: number; valor: unknown; estoque: number | null } | null> {
  const prod = await db.query('SELECT id, valor, estoque FROM produtos WHERE id = $1', [produtoId]);
  return (prod.rows[0] as { id: number; valor: unknown; estoque: number | null } | undefined) ?? null;
}

export async function findStockConfig(db: pg.Pool): Promise<Record<string, string>> {
  const configRes = await db
    .query(
      "SELECT chave, valor FROM configuracoes WHERE chave IN ('controla_estoque', 'reservar_estoque_carrinho')",
    )
    .catch(() => ({ rows: [] }));

  const cfgMap: Record<string, string> = {};
  for (const row of configRes.rows as Array<{ chave: string; valor: string }>) {
    cfgMap[row.chave] = row.valor;
  }
  return cfgMap;
}

export async function sumReservedQuantity(db: pg.Pool, produtoId: number): Promise<number> {
  const reservadoRes = await db.query(
    'SELECT COALESCE(SUM(quantidade), 0) AS total FROM carrinho_itens WHERE produto_id = $1',
    [produtoId],
  );
  return parseInt(String(reservadoRes.rows[0]?.total ?? 0), 10);
}

export async function findCartItemQuantity(
  db: pg.Pool,
  usuarioId: number,
  produtoId: number,
): Promise<number> {
  const noCarrinhoRes = await db.query(
    'SELECT COALESCE(quantidade, 0) AS qtd FROM carrinho_itens WHERE usuario_id = $1 AND produto_id = $2',
    [usuarioId, produtoId],
  );
  return parseInt(String(noCarrinhoRes.rows[0]?.qtd ?? 0), 10);
}

export async function upsertCartItem(
  db: pg.Pool,
  usuarioId: number,
  produtoId: number,
  quantidade: number,
  precoUnitario: unknown,
): Promise<void> {
  await db.query(
    `INSERT INTO carrinho_itens (usuario_id, produto_id, quantidade, preco_unitario)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (usuario_id, produto_id) DO UPDATE
       SET quantidade = carrinho_itens.quantidade + $3, updated_at = NOW()`,
    [usuarioId, produtoId, quantidade, precoUnitario],
  );
}

export async function deleteCartItem(
  db: pg.Pool,
  itemId: number,
  usuarioId: number,
): Promise<void> {
  await db.query('DELETE FROM carrinho_itens WHERE id = $1 AND usuario_id = $2', [
    itemId,
    usuarioId,
  ]);
}

export async function updateCartItemQuantity(
  db: pg.Pool,
  itemId: number,
  usuarioId: number,
  quantidade: number,
): Promise<void> {
  await db.query(
    'UPDATE carrinho_itens SET quantidade = $1, updated_at = NOW() WHERE id = $2 AND usuario_id = $3',
    [quantidade, itemId, usuarioId],
  );
}
