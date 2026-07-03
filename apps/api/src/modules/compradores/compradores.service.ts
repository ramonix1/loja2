import type {
  CompradorDetail,
  CompradorDetailResponse,
  CompradorListItem,
  CompradoresTotais,
  ListCompradoresQuery,
} from '@lojao/types/compradores';

import {
  appointmentStatusToApi,
  orderStatusToApi,
} from '../../lib/merchant-schema-map.js';
import type { StoreScope } from '../../lib/store-scope.js';

function toIso(value: Date | string | null | undefined): string | null {
  if (value == null) return null;
  return value instanceof Date ? value.toISOString() : String(value);
}

function mapListRow(row: {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  cpf: string | null;
  city: string | null;
  state: string | null;
  active: boolean;
  created_at: Date | string;
  last_access_at: Date | string | null;
  total_pedidos: string | number;
  total_gasto: string | number;
}): CompradorListItem {
  return {
    id: row.id,
    nome: row.name,
    email: row.email,
    telefone: row.phone,
    cpf: row.cpf,
    cidade: row.city,
    estado: row.state,
    ativo: row.active,
    created_at: toIso(row.created_at) ?? '',
    ultimo_acesso: toIso(row.last_access_at),
    total_pedidos: Number(row.total_pedidos),
    total_gasto: Number(row.total_gasto),
  };
}

/** Porta `compradorController.listar`. */
export async function listCompradores(
  { pool, storeId }: StoreScope,
  query: ListCompradoresQuery,
): Promise<{ compradores: CompradorListItem[]; totais: CompradoresTotais }> {
  const busca = query.busca?.trim() ?? '';

  let listSql: string;
  let params: (string | number)[];

  if (busca) {
    listSql = `
      SELECT b.id, b.name, b.email, b.phone, b.cpf, b.city, b.state,
             b.active, b.created_at, b.last_access_at,
             COUNT(o.id) AS total_pedidos,
             COALESCE(SUM(o.total) FILTER (WHERE o.status NOT IN ('cancelled')), 0) AS total_gasto
      FROM buyers b
      LEFT JOIN orders o ON o.buyer_id = b.id AND o.store_id = b.store_id
      WHERE b.store_id = $1
        AND (b.name ILIKE $2 OR b.email ILIKE $2 OR b.cpf ILIKE $2 OR b.phone ILIKE $2)
      GROUP BY b.id ORDER BY b.created_at DESC
    `;
    params = [storeId, `%${busca}%`];
  } else {
    listSql = `
      SELECT b.id, b.name, b.email, b.phone, b.cpf, b.city, b.state,
             b.active, b.created_at, b.last_access_at,
             COUNT(o.id) AS total_pedidos,
             COALESCE(SUM(o.total) FILTER (WHERE o.status NOT IN ('cancelled')), 0) AS total_gasto
      FROM buyers b
      LEFT JOIN orders o ON o.buyer_id = b.id AND o.store_id = b.store_id
      WHERE b.store_id = $1
      GROUP BY b.id ORDER BY b.created_at DESC
    `;
    params = [storeId];
  }

  const [compradoresRes, totaisRes] = await Promise.all([
    pool.query(listSql, params),
    pool.query(
      `
      SELECT
        COUNT(*)::int AS total_compradores,
        COUNT(*) FILTER (WHERE active = true)::int AS ativos,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int AS novos_mes
      FROM buyers WHERE store_id = $1
    `,
      [storeId],
    ),
  ]);

  const totaisRow = totaisRes.rows[0] as {
    total_compradores: number;
    ativos: number;
    novos_mes: number;
  };

  return {
    compradores: compradoresRes.rows.map(mapListRow),
    totais: {
      total_compradores: Number(totaisRow.total_compradores),
      ativos: Number(totaisRow.ativos),
      novos_mes: Number(totaisRow.novos_mes),
    },
  };
}

/** Porta `compradorController.detalhe`. */
export async function getComprador(
  { pool, storeId }: StoreScope,
  id: number,
): Promise<CompradorDetailResponse | null> {
  const [buyerRes, pedidosRes, agendamentosRes, totalRes] = await Promise.all([
    pool.query(`SELECT * FROM buyers WHERE id = $1 AND store_id = $2`, [id, storeId]),
    pool.query(
      `SELECT o.*,
              COUNT(oi.id)::int AS qtd_itens,
              COALESCE(
                JSON_AGG(
                  JSON_BUILD_OBJECT(
                    'nome', oi.product_name,
                    'quantidade', oi.quantity,
                    'preco_unitario', oi.unit_price,
                    'subtotal', oi.subtotal
                  ) ORDER BY oi.id
                ) FILTER (WHERE oi.id IS NOT NULL),
                '[]'::json
              ) AS itens
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id AND oi.store_id = o.store_id
       WHERE o.buyer_id = $1 AND o.store_id = $2
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [id, storeId],
    ),
    pool.query(
      `SELECT a.*, o.id AS pedido_id, o.total AS pedido_total,
              o.shipping_name AS nome_entrega, o.status AS pedido_status
       FROM appointments a
       JOIN orders o ON o.id = a.order_id AND o.store_id = a.store_id
       WHERE o.buyer_id = $1 AND a.store_id = $2
       ORDER BY a.event_date DESC`,
      [id, storeId],
    ).catch(() => ({ rows: [] as Record<string, unknown>[] })),
    pool.query(
      `SELECT
         COUNT(*)::int AS total_pedidos,
         COALESCE(SUM(total) FILTER (WHERE status NOT IN ('cancelled')), 0) AS total_gasto,
         COALESCE(SUM(total) FILTER (WHERE status = 'cancelled'), 0) AS total_cancelado,
         MAX(created_at) AS ultimo_pedido
       FROM orders WHERE buyer_id = $1 AND store_id = $2`,
      [id, storeId],
    ),
  ]);

  const buyerRow = buyerRes.rows[0];
  if (!buyerRow) return null;

  const comprador: CompradorDetail = {
    id: buyerRow.id as number,
    nome: buyerRow.name as string,
    email: buyerRow.email as string,
    telefone: (buyerRow.phone as string | null) ?? null,
    cpf: (buyerRow.cpf as string | null) ?? null,
    cep: (buyerRow.postal_code as string | null) ?? null,
    logradouro: (buyerRow.street as string | null) ?? null,
    numero: (buyerRow.number as string | null) ?? null,
    complemento: (buyerRow.complement as string | null) ?? null,
    bairro: (buyerRow.district as string | null) ?? null,
    cidade: (buyerRow.city as string | null) ?? null,
    estado: (buyerRow.state as string | null) ?? null,
    ativo: Boolean(buyerRow.active),
    created_at: toIso(buyerRow.created_at as Date | string) ?? '',
    ultimo_acesso: toIso(buyerRow.last_access_at as Date | string | null),
  };

  const pedidos = pedidosRes.rows.map((row) => {
    const rawItens = row.itens;
    const itens = Array.isArray(rawItens)
      ? rawItens.map((item: Record<string, unknown>) => ({
          nome: String(item.nome ?? ''),
          quantidade: Number(item.quantidade),
          preco_unitario: Number(item.preco_unitario),
          subtotal: Number(item.subtotal),
        }))
      : [];

    return {
      id: row.id as number,
      status: orderStatusToApi(String(row.status)),
      total: Number(row.total),
      frete: Number(row.shipping_fee ?? 0),
      created_at: toIso(row.created_at as Date | string) ?? '',
      qtd_itens: Number(row.qtd_itens),
      itens,
    };
  });

  const agendamentos = agendamentosRes.rows.map((row) => ({
    id: row.id as number,
    pedido_id: row.pedido_id as number,
    data_evento:
      row.event_date instanceof Date
        ? row.event_date.toISOString().slice(0, 10)
        : String(row.event_date).slice(0, 10),
    status: appointmentStatusToApi(String(row.status)),
    pedido_total: Number(row.pedido_total),
    nome_entrega: (row.nome_entrega as string | null) ?? null,
    pedido_status: orderStatusToApi(String(row.pedido_status)),
  }));

  const resumoRow = totalRes.rows[0] as {
    total_pedidos: number;
    total_gasto: string | number;
    total_cancelado: string | number;
    ultimo_pedido: Date | string | null;
  };

  return {
    comprador,
    pedidos,
    agendamentos,
    resumo: {
      total_pedidos: Number(resumoRow.total_pedidos),
      total_gasto: Number(resumoRow.total_gasto),
      total_cancelado: Number(resumoRow.total_cancelado),
      ultimo_pedido: toIso(resumoRow.ultimo_pedido),
    },
  };
}
