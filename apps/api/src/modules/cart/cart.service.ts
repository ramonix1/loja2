import type { StoreScope } from '../../lib/store-scope.js';

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

export async function getCartItems(scope: StoreScope, buyerId: number): Promise<CartItem[]> {
  const r = await scope.pool.query(
    `SELECT
       ci.id, ci.quantity AS quantidade, ci.unit_price AS preco_unitario,
       ci.unit_price * ci.quantity AS subtotal,
       p.id AS produto_id, p.name AS nome, p.subtitle AS subtitulo,
       (SELECT url FROM product_images
        WHERE product_id = p.id AND store_id = p.store_id ORDER BY id LIMIT 1) AS imagem
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id AND p.store_id = ci.store_id
     WHERE ci.buyer_id = $1 AND ci.store_id = $2
     ORDER BY ci.created_at ASC`,
    [buyerId, scope.storeId],
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

export async function countCartItems(scope: StoreScope, buyerId: number): Promise<number> {
  const r = await scope.pool.query(
    'SELECT COALESCE(SUM(quantity), 0) AS total FROM cart_items WHERE buyer_id = $1 AND store_id = $2',
    [buyerId, scope.storeId],
  );
  return parseInt(String(r.rows[0]?.total ?? 0), 10);
}

export async function addCartItem(
  scope: StoreScope,
  buyerId: number,
  produtoId: number,
  quantidade: number,
): Promise<{ contagem: number } | { error: string; code: string; status: number }> {
  const qtd = Math.max(1, quantidade);

  const prod = await scope.pool.query(
    'SELECT id, price AS valor, stock AS estoque FROM products WHERE id = $1 AND store_id = $2',
    [produtoId, scope.storeId],
  );
  if (!prod.rows[0]) {
    return { error: 'Produto não encontrado.', code: 'NOT_FOUND', status: 404 };
  }

  const configRes = await scope.pool
    .query(
      `SELECT key, value FROM store_settings
       WHERE store_id = $1 AND key IN ('inventory.enabled', 'inventory.reserve_on_cart')`,
      [scope.storeId],
    )
    .catch(() => ({ rows: [] }));

  const cfgMap: Record<string, string> = {};
  for (const row of configRes.rows as Array<{ key: string; value: string }>) {
    const ptKey = row.key === 'inventory.enabled' ? 'controla_estoque' : 'reservar_estoque_carrinho';
    cfgMap[ptKey] = row.value;
  }

  const estoque = prod.rows[0].estoque as number | null;
  if (cfgMap.controla_estoque === 'true' && estoque !== null) {
    if (cfgMap.reservar_estoque_carrinho === 'true') {
      const reservadoRes = await scope.pool.query(
        'SELECT COALESCE(SUM(quantity), 0) AS total FROM cart_items WHERE product_id = $1 AND store_id = $2',
        [produtoId, scope.storeId],
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
      const noCarrinhoRes = await scope.pool.query(
        'SELECT COALESCE(quantity, 0) AS qtd FROM cart_items WHERE buyer_id = $1 AND product_id = $2 AND store_id = $3',
        [buyerId, produtoId, scope.storeId],
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

  await scope.pool.query(
    `INSERT INTO cart_items (store_id, buyer_id, product_id, quantity, unit_price)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (buyer_id, product_id) DO UPDATE
       SET quantity = cart_items.quantity + $4, updated_at = NOW()`,
    [scope.storeId, buyerId, produtoId, qtd, prod.rows[0].valor],
  );

  const contagem = await countCartItems(scope, buyerId);
  return { contagem };
}

export async function updateCartItem(
  scope: StoreScope,
  buyerId: number,
  itemId: number,
  quantidade: number,
): Promise<{ contagem: number; total: string; itens: CartItem[] }> {
  if (!quantidade || quantidade < 1) {
    await scope.pool.query(
      'DELETE FROM cart_items WHERE id = $1 AND buyer_id = $2 AND store_id = $3',
      [itemId, buyerId, scope.storeId],
    );
  } else {
    await scope.pool.query(
      'UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2 AND buyer_id = $3 AND store_id = $4',
      [quantidade, itemId, buyerId, scope.storeId],
    );
  }

  const itens = await getCartItems(scope, buyerId);
  const total = itens.reduce((s, i) => s + i.subtotal, 0);
  const contagem = itens.reduce((s, i) => s + i.quantidade, 0);
  return { contagem, total: total.toFixed(2), itens };
}

export async function removeCartItem(
  scope: StoreScope,
  buyerId: number,
  itemId: number,
): Promise<{ contagem: number; total: string }> {
  await scope.pool.query(
    'DELETE FROM cart_items WHERE id = $1 AND buyer_id = $2 AND store_id = $3',
    [itemId, buyerId, scope.storeId],
  );
  const itens = await getCartItems(scope, buyerId);
  const total = itens.reduce((s, i) => s + i.subtotal, 0);
  const contagem = itens.reduce((s, i) => s + i.quantidade, 0);
  return { contagem, total: total.toFixed(2) };
}
