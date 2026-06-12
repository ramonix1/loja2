import type pg from 'pg';

export interface CartItem {
  id: number;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  produto_id: number;
  nome: string;
  subtitulo: string | null;
  imagem: string | null;
}

export async function getCartItems(db: pg.Pool, usuarioId: number): Promise<CartItem[]> {
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
  return r.rows.map((row) => ({
    ...row,
    quantidade: Number(row.quantidade),
    preco_unitario: parseFloat(String(row.preco_unitario)),
    subtotal: parseFloat(String(row.subtotal)),
    produto_id: Number(row.produto_id),
    id: Number(row.id),
  }));
}

export async function countCartItems(db: pg.Pool, usuarioId: number): Promise<number> {
  const r = await db.query(
    'SELECT COALESCE(SUM(quantidade), 0) AS total FROM carrinho_itens WHERE usuario_id = $1',
    [usuarioId],
  );
  return parseInt(String(r.rows[0]?.total ?? 0), 10);
}

export async function addCartItem(
  db: pg.Pool,
  usuarioId: number,
  produtoId: number,
  quantidade: number,
): Promise<{ contagem: number } | { error: string; code: string; status: number }> {
  const qtd = Math.max(1, quantidade);

  const prod = await db.query('SELECT id, valor, estoque FROM produtos WHERE id = $1', [produtoId]);
  if (!prod.rows[0]) {
    return { error: 'Produto não encontrado.', code: 'NOT_FOUND', status: 404 };
  }

  const configRes = await db
    .query(
      "SELECT chave, valor FROM configuracoes WHERE chave IN ('controla_estoque', 'reservar_estoque_carrinho')",
    )
    .catch(() => ({ rows: [] }));

  const cfgMap: Record<string, string> = {};
  for (const row of configRes.rows as Array<{ chave: string; valor: string }>) {
    cfgMap[row.chave] = row.valor;
  }

  const estoque = prod.rows[0].estoque as number | null;
  if (cfgMap.controla_estoque === 'true' && estoque !== null) {
    if (cfgMap.reservar_estoque_carrinho === 'true') {
      const reservadoRes = await db.query(
        'SELECT COALESCE(SUM(quantidade), 0) AS total FROM carrinho_itens WHERE produto_id = $1',
        [produtoId],
      );
      const reservado = parseInt(String(reservadoRes.rows[0]?.total ?? 0), 10);
      if (reservado + qtd > estoque) {
        const disponivel = Math.max(0, estoque - reservado);
        return {
          error:
            disponivel === 0
              ? 'Produto esgotado.'
              : `Apenas ${disponivel} unidade(s) disponível(is).`,
          code: 'INSUFFICIENT_STOCK',
          status: 400,
        };
      }
    } else {
      if (estoque <= 0) {
        return { error: 'Produto esgotado.', code: 'INSUFFICIENT_STOCK', status: 400 };
      }
      const noCarrinhoRes = await db.query(
        'SELECT COALESCE(quantidade, 0) AS qtd FROM carrinho_itens WHERE usuario_id = $1 AND produto_id = $2',
        [usuarioId, produtoId],
      );
      const noCarrinho = parseInt(String(noCarrinhoRes.rows[0]?.qtd ?? 0), 10);
      if (noCarrinho + qtd > estoque) {
        return {
          error: `Apenas ${Math.max(0, estoque - noCarrinho)} unidade(s) disponível(is).`,
          code: 'INSUFFICIENT_STOCK',
          status: 400,
        };
      }
    }
  }

  await db.query(
    `INSERT INTO carrinho_itens (usuario_id, produto_id, quantidade, preco_unitario)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (usuario_id, produto_id) DO UPDATE
       SET quantidade = carrinho_itens.quantidade + $3, updated_at = NOW()`,
    [usuarioId, produtoId, qtd, prod.rows[0].valor],
  );

  const contagem = await countCartItems(db, usuarioId);
  return { contagem };
}

export async function updateCartItem(
  db: pg.Pool,
  usuarioId: number,
  itemId: number,
  quantidade: number,
): Promise<{ contagem: number; total: string; itens: CartItem[] }> {
  if (!quantidade || quantidade < 1) {
    await db.query('DELETE FROM carrinho_itens WHERE id = $1 AND usuario_id = $2', [
      itemId,
      usuarioId,
    ]);
  } else {
    await db.query(
      'UPDATE carrinho_itens SET quantidade = $1, updated_at = NOW() WHERE id = $2 AND usuario_id = $3',
      [quantidade, itemId, usuarioId],
    );
  }

  const itens = await getCartItems(db, usuarioId);
  const total = itens.reduce((s, i) => s + i.subtotal, 0);
  const contagem = itens.reduce((s, i) => s + i.quantidade, 0);
  return { contagem, total: total.toFixed(2), itens };
}

export async function removeCartItem(
  db: pg.Pool,
  usuarioId: number,
  itemId: number,
): Promise<{ contagem: number; total: string }> {
  await db.query('DELETE FROM carrinho_itens WHERE id = $1 AND usuario_id = $2', [
    itemId,
    usuarioId,
  ]);
  const itens = await getCartItems(db, usuarioId);
  const total = itens.reduce((s, i) => s + i.subtotal, 0);
  const contagem = itens.reduce((s, i) => s + i.quantidade, 0);
  return { contagem, total: total.toFixed(2) };
}
