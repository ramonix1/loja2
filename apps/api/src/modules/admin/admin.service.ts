import type { PedidoDetalhe, PedidoRecente, UpdatePedidoStatusInput } from '@lojao/types/pedidos';

import {
  orderStatusFromApi,
  orderStatusToApi,
} from '../../lib/merchant-schema-map.js';
import type { StoreScope } from '../../lib/store-scope.js';

import type { PedidosQuery } from './admin.schemas.js';

export interface DashboardStats {
  pedidos_hoje: number;
  pedidos_pendentes: number;
  receita_mes: number;
  produtos_ativos: number;
  total_categorias: number;
  total_banners: number;
  total_pedidos: number;
  receita_total: number;
  pedidos_recentes: PedidoRecente[];
}

export interface PedidoResumo {
  id: number;
  created_at: string;
  status: string;
  total: number;
  metodo_pagamento: string | null;
  total_itens: number;
  cliente_nome: string | null;
  cliente_email: string | null;
}

/**
 * Estatísticas do dashboard admin. Porta as queries de
 * `produtoController.dashboard` / `checkoutController.adminPedidos`, adaptadas
 * para os 4 cards da Fase 2. (Tabela `products` não tem flag `active`, então
 * `produtos_ativos` = total de produtos, igual ao card do legacy.)
 */
export async function getDashboardStats({ pool, storeId }: StoreScope): Promise<DashboardStats> {
  const [hoje, pendentes, receita, produtos, categorias, banners, totalPedidos, receitaTotal, recentes] =
    await Promise.all([
      pool.query<{ c: number }>(
        'SELECT COUNT(*)::int AS c FROM orders WHERE store_id = $1 AND created_at::date = CURRENT_DATE',
        [storeId],
      ),
      pool.query<{ c: number }>(
        "SELECT COUNT(*)::int AS c FROM orders WHERE store_id = $1 AND status = 'awaiting_payment'",
        [storeId],
      ),
      pool.query<{ s: string }>(
        "SELECT COALESCE(SUM(total), 0) AS s FROM orders WHERE store_id = $1 AND status = 'paid' AND created_at >= date_trunc('month', CURRENT_DATE)",
        [storeId],
      ),
      pool.query<{ c: number }>('SELECT COUNT(*)::int AS c FROM products WHERE store_id = $1', [
        storeId,
      ]),
      pool.query<{ c: number }>(
        'SELECT COUNT(*)::int AS c FROM categories WHERE store_id = $1',
        [storeId],
      ).catch(() => ({ rows: [{ c: 0 }] })),
      pool.query<{ c: number }>(
        'SELECT COUNT(*)::int AS c FROM banners WHERE store_id = $1 AND active = true',
        [storeId],
      ).catch(() => ({ rows: [{ c: 0 }] })),
      pool.query<{ c: number }>('SELECT COUNT(*)::int AS c FROM orders WHERE store_id = $1', [
        storeId,
      ]),
      pool.query<{ s: string }>(
        "SELECT COALESCE(SUM(total), 0) AS s FROM orders WHERE store_id = $1 AND status = 'paid'",
        [storeId],
      ),
      pool.query(
        `SELECT o.id, o.status, o.total, o.created_at, o.payment_method AS metodo_pagamento,
                b.name AS cliente_nome
         FROM orders o
         JOIN buyers b ON b.id = o.buyer_id AND b.store_id = o.store_id
         WHERE o.store_id = $1
         ORDER BY o.created_at DESC
         LIMIT 5`,
        [storeId],
      ),
    ]);

  return {
    pedidos_hoje: hoje.rows[0]?.c ?? 0,
    pedidos_pendentes: pendentes.rows[0]?.c ?? 0,
    receita_mes: Number(receita.rows[0]?.s ?? 0),
    produtos_ativos: produtos.rows[0]?.c ?? 0,
    total_categorias: categorias.rows[0]?.c ?? 0,
    total_banners: banners.rows[0]?.c ?? 0,
    total_pedidos: totalPedidos.rows[0]?.c ?? 0,
    receita_total: Number(receitaTotal.rows[0]?.s ?? 0),
    pedidos_recentes: recentes.rows.map((r) => ({
      id: Number(r.id),
      status: orderStatusToApi(String(r.status)),
      total: Number(r.total),
      created_at: String(r.created_at),
      metodo_pagamento: (r.metodo_pagamento as string | null) ?? null,
      cliente_nome: String(r.cliente_nome),
    })),
  };
}

/** Lista paginada de pedidos (read-only) com dados do cliente. */
export async function listPedidos(
  scope: StoreScope,
  { page, perPage, status }: PedidosQuery,
): Promise<{ data: PedidoResumo[]; total: number }> {
  const { pool, storeId } = scope;
  const offset = (page - 1) * perPage;
  const enStatus = status ? orderStatusFromApi(status) : null;

  const countParams = enStatus ? [storeId, enStatus] : [storeId];
  const countSql = enStatus
    ? 'SELECT COUNT(*)::int AS total FROM orders WHERE store_id = $1 AND status = $2'
    : 'SELECT COUNT(*)::int AS total FROM orders WHERE store_id = $1';

  const countRes = await pool.query<{ total: number }>(countSql, countParams);
  const total = Number(countRes.rows[0]?.total ?? 0);

  const listParams = enStatus
    ? [storeId, enStatus, perPage, offset]
    : [storeId, perPage, offset];
  const listSql = enStatus
    ? `
      SELECT o.id, o.created_at, o.status, o.total, o.payment_method AS metodo_pagamento,
             b.name AS cliente_nome, b.email AS cliente_email,
             (SELECT COUNT(*)::int FROM order_items oi WHERE oi.order_id = o.id AND oi.store_id = o.store_id) AS total_itens
      FROM orders o
      INNER JOIN buyers b ON b.id = o.buyer_id AND b.store_id = o.store_id
      WHERE o.store_id = $1 AND o.status = $2
      ORDER BY o.created_at DESC
      LIMIT $3 OFFSET $4
    `
    : `
      SELECT o.id, o.created_at, o.status, o.total, o.payment_method AS metodo_pagamento,
             b.name AS cliente_nome, b.email AS cliente_email,
             (SELECT COUNT(*)::int FROM order_items oi WHERE oi.order_id = o.id AND oi.store_id = o.store_id) AS total_itens
      FROM orders o
      INNER JOIN buyers b ON b.id = o.buyer_id AND b.store_id = o.store_id
      WHERE o.store_id = $1
      ORDER BY o.created_at DESC
      LIMIT $2 OFFSET $3
    `;

  const rowsRes = await pool.query(listSql, listParams);

  const data: PedidoResumo[] = rowsRes.rows.map((row) => ({
    id: row.id as number,
    created_at:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at ?? ''),
    status: orderStatusToApi(String(row.status)),
    total: Number(row.total),
    metodo_pagamento: (row.metodo_pagamento as string | null) ?? null,
    total_itens: Number(row.total_itens ?? 0),
    cliente_nome: row.cliente_nome as string,
    cliente_email: row.cliente_email as string,
  }));

  return { data, total };
}

/** Porta `checkoutController.adminDetalhePedido`. */
export async function getPedidoById(
  { pool, storeId }: StoreScope,
  id: number,
): Promise<PedidoDetalhe | null> {
  const pedidoRes = await pool.query(
    `SELECT o.*, b.name AS usuario_nome, b.email AS usuario_email
     FROM orders o
     JOIN buyers b ON b.id = o.buyer_id AND b.store_id = o.store_id
     WHERE o.id = $1 AND o.store_id = $2`,
    [id, storeId],
  );
  const row = pedidoRes.rows[0];
  if (!row) return null;

  const itensRes = await pool.query(
    `SELECT id, product_id, product_name, quantity, unit_price, subtotal
     FROM order_items WHERE order_id = $1 AND store_id = $2 ORDER BY id`,
    [id, storeId],
  );

  let pagamento: PedidoDetalhe['pagamento'] = null;
  try {
    const pagRes = await pool.query(
      `SELECT id, mp_payment_id, status, status_mp, method
       FROM payments WHERE order_id = $1 AND store_id = $2 ORDER BY id DESC LIMIT 1`,
      [id, storeId],
    );
    if (pagRes.rows[0]) {
      pagamento = {
        id: Number(pagRes.rows[0].id),
        mp_payment_id: (pagRes.rows[0].mp_payment_id as string | null) ?? null,
        status: String(pagRes.rows[0].status),
        status_mp: (pagRes.rows[0].status_mp as string | null) ?? null,
        metodo: (pagRes.rows[0].method as string | null) ?? null,
      };
    }
  } catch {
    pagamento = null;
  }

  const ptStatus = orderStatusToApi(String(row.status)) as PedidoDetalhe['status'];

  return {
    id: Number(row.id),
    status: ptStatus,
    subtotal: Number(row.subtotal ?? 0),
    frete: Number(row.shipping_fee ?? 0),
    total: Number(row.total ?? 0),
    metodo_pagamento: (row.payment_method as string | null) ?? null,
    codigo_rastreio: (row.tracking_code as string | null) ?? null,
    created_at: String(row.created_at),
    usuario_nome: String(row.usuario_nome),
    usuario_email: String(row.usuario_email),
    nome_entrega: (row.shipping_name as string | null) ?? null,
    email_entrega: (row.shipping_email as string | null) ?? null,
    telefone_entrega: (row.shipping_phone as string | null) ?? null,
    cpf_entrega: (row.shipping_cpf as string | null) ?? null,
    cep: (row.shipping_postal_code as string | null) ?? null,
    logradouro: (row.shipping_street as string | null) ?? null,
    numero: (row.shipping_number as string | null) ?? null,
    complemento: (row.shipping_complement as string | null) ?? null,
    bairro: (row.shipping_district as string | null) ?? null,
    cidade: (row.shipping_city as string | null) ?? null,
    estado: (row.shipping_state as string | null) ?? null,
    itens: itensRes.rows.map((i) => ({
      id: Number(i.id),
      produto_id: i.product_id === null ? null : Number(i.product_id),
      nome_produto: String(i.product_name),
      quantidade: Number(i.quantity),
      preco_unitario: Number(i.unit_price),
      subtotal: Number(i.subtotal),
    })),
    pagamento,
  };
}

/** Porta `checkoutController.adminAtualizarStatus` (sem e-mail — ver STATUS). */
export async function updatePedidoStatus(
  scope: StoreScope,
  id: number,
  input: UpdatePedidoStatusInput,
): Promise<PedidoDetalhe | null> {
  const { pool, storeId } = scope;
  const rastreio = input.codigo_rastreio?.trim() || null;
  const enStatus = orderStatusFromApi(input.status);

  const upd = await pool.query(
    `UPDATE orders
     SET status = $1,
         tracking_code = COALESCE($2, tracking_code),
         updated_at = NOW()
     WHERE id = $3 AND store_id = $4`,
    [enStatus, rastreio, id, storeId],
  );
  if ((upd.rowCount ?? 0) === 0) return null;

  return getPedidoById(scope, id);
}
