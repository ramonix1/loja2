import type { StoreScope } from '../../lib/store-scope.js';

export interface CartItemRow {
  id: number;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  produto_id: number;
  nome: string;
  subtitulo: string | null;
  imagem: string | null;
}

export async function purgeOrphanedItems(scope: StoreScope, buyerId: number): Promise<void> {
  await scope.pool.query(
    `DELETE FROM cart_items ci
     WHERE ci.buyer_id = $1 AND ci.store_id = $2
       AND NOT EXISTS (
         SELECT 1 FROM products p
         WHERE p.id = ci.product_id AND p.store_id = ci.store_id
       )`,
    [buyerId, scope.storeId],
  );
}

export async function findCartItems(scope: StoreScope, buyerId: number): Promise<CartItemRow[]> {
  await purgeOrphanedItems(scope, buyerId);

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

export async function findProductForCart(
  scope: StoreScope,
  produtoId: number,
): Promise<{ id: number; valor: number; estoque: number | null } | null> {
  const r = await scope.pool.query(
    'SELECT id, price AS valor, stock AS estoque FROM products WHERE id = $1 AND store_id = $2',
    [produtoId, scope.storeId],
  );
  if (!r.rows[0]) return null;
  return {
    id: Number(r.rows[0].id),
    valor: parseFloat(String(r.rows[0].valor)),
    estoque: r.rows[0].estoque == null ? null : Number(r.rows[0].estoque),
  };
}

export async function findStoreInventoryConfig(
  scope: StoreScope,
): Promise<Record<string, string>> {
  const r = await scope.pool
    .query(
      `SELECT key, value FROM store_settings
       WHERE store_id = $1 AND key IN ('inventory.enabled', 'inventory.reserve_on_cart')`,
      [scope.storeId],
    )
    .catch(() => ({ rows: [] }));

  const map: Record<string, string> = {};
  for (const row of r.rows as Array<{ key: string; value: string }>) {
    const ptKey = row.key === 'inventory.enabled' ? 'controla_estoque' : 'reservar_estoque_carrinho';
    map[ptKey] = row.value;
  }
  return map;
}

export async function findReservedQuantity(
  scope: StoreScope,
  produtoId: number,
): Promise<number> {
  const r = await scope.pool.query(
    'SELECT COALESCE(SUM(quantity), 0) AS total FROM cart_items WHERE product_id = $1 AND store_id = $2',
    [produtoId, scope.storeId],
  );
  return parseInt(String(r.rows[0]?.total ?? 0), 10);
}

export async function findBuyerCartQuantity(
  scope: StoreScope,
  buyerId: number,
  produtoId: number,
): Promise<number> {
  const r = await scope.pool.query(
    'SELECT COALESCE(quantity, 0) AS qtd FROM cart_items WHERE buyer_id = $1 AND product_id = $2 AND store_id = $3',
    [buyerId, produtoId, scope.storeId],
  );
  return parseInt(String(r.rows[0]?.qtd ?? 0), 10);
}

export async function upsertCartItem(
  scope: StoreScope,
  buyerId: number,
  produtoId: number,
  quantidade: number,
  preco: number,
): Promise<void> {
  await scope.pool.query(
    `INSERT INTO cart_items (store_id, buyer_id, product_id, quantity, unit_price)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (buyer_id, product_id) DO UPDATE
       SET quantity = cart_items.quantity + $4, updated_at = NOW()`,
    [scope.storeId, buyerId, produtoId, quantidade, preco],
  );
}

export async function setCartItemQuantity(
  scope: StoreScope,
  buyerId: number,
  itemId: number,
  quantidade: number,
): Promise<void> {
  await scope.pool.query(
    'UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2 AND buyer_id = $3 AND store_id = $4',
    [quantidade, itemId, buyerId, scope.storeId],
  );
}

export async function deleteCartItem(
  scope: StoreScope,
  buyerId: number,
  itemId: number,
): Promise<void> {
  await scope.pool.query(
    'DELETE FROM cart_items WHERE id = $1 AND buyer_id = $2 AND store_id = $3',
    [itemId, buyerId, scope.storeId],
  );
}
