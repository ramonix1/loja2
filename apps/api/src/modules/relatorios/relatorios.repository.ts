import type { FiltroEstoque } from '@lojao/types/relatorios';
import { FILTROS_ESTOQUE } from '@lojao/types/relatorios';

import {
  appointmentStatusToApi,
  orderStatusToApi,
} from '../../lib/merchant-schema-map.js';
import type { StoreScope } from '../../lib/store-scope.js';
import {
  fetchReceitaPorDia,
  fetchReceitaPorMetodo,
  toNum,
} from '../admin/order-analytics.js';

const FILTROS_ESTOQUE_VALIDOS: Record<FiltroEstoque, string> = {
  todos: '',
  esgotado: 'AND p.stock = 0',
  baixo: 'AND p.stock > 0 AND p.stock <= 5',
  ok: 'AND p.stock > 5',
  ilimitado: 'AND p.stock IS NULL',
};

export async function fetchDadosVendas(scope: StoreScope, dataInicio: Date, dataFim: Date) {
  const { pool, storeId } = scope;
  const [pedidosRes, resumoRes, porDiaRes] = await Promise.all([
    pool.query(
      `SELECT o.id, o.created_at, o.shipping_name AS nome_entrega, o.shipping_email AS email_entrega,
              o.subtotal, o.shipping_fee AS frete, o.total, o.status, o.payment_method AS metodo_pagamento,
              b.name AS cliente_nome,
              COUNT(oi.id)::int AS qtd_itens
       FROM orders o
       JOIN buyers b ON b.id = o.buyer_id AND b.store_id = o.store_id
       LEFT JOIN order_items oi ON oi.order_id = o.id AND oi.store_id = o.store_id
       WHERE o.store_id = $3 AND o.created_at BETWEEN $1 AND $2
       GROUP BY o.id, b.name
       ORDER BY o.created_at DESC`,
      [dataInicio, dataFim, storeId],
    ),
    pool.query(
      `SELECT
        COUNT(*)::int AS total_pedidos,
        COALESCE(SUM(total) FILTER (WHERE status NOT IN ('cancelled','awaiting_payment')), 0) AS receita_confirmada,
        COALESCE(SUM(total) FILTER (WHERE status = 'awaiting_payment'), 0) AS receita_pendente,
        COALESCE(SUM(total) FILTER (WHERE status = 'cancelled'), 0) AS receita_cancelada,
        COUNT(*) FILTER (WHERE status = 'cancelled')::int AS pedidos_cancelados,
        CASE WHEN COUNT(*) FILTER (WHERE status NOT IN ('cancelled','awaiting_payment')) > 0
             THEN ROUND(SUM(total) FILTER (WHERE status NOT IN ('cancelled','awaiting_payment'))
                  / COUNT(*) FILTER (WHERE status NOT IN ('cancelled','awaiting_payment')), 2)
             ELSE 0 END AS ticket_medio
       FROM orders
       WHERE store_id = $3 AND created_at BETWEEN $1 AND $2`,
      [dataInicio, dataFim, storeId],
    ),
    pool.query(
      `SELECT DATE_TRUNC('day', created_at) AS dia, COUNT(*)::int AS total_pedidos,
              COALESCE(SUM(total) FILTER (WHERE status NOT IN ('cancelled')), 0) AS receita
       FROM orders
       WHERE store_id = $3 AND created_at BETWEEN $1 AND $2
       GROUP BY dia ORDER BY dia`,
      [dataInicio, dataFim, storeId],
    ),
  ]);

  return {
    pedidos: pedidosRes.rows.map((r) => ({
      ...r,
      status: orderStatusToApi(String(r.status)),
      subtotal: toNum(r.subtotal),
      frete: toNum(r.frete),
      total: toNum(r.total),
      qtd_itens: Number(r.qtd_itens),
    })),
    resumo: {
      total_pedidos: Number(resumoRes.rows[0]?.total_pedidos ?? 0),
      receita_confirmada: toNum(resumoRes.rows[0]?.receita_confirmada),
      receita_pendente: toNum(resumoRes.rows[0]?.receita_pendente),
      receita_cancelada: toNum(resumoRes.rows[0]?.receita_cancelada),
      pedidos_cancelados: Number(resumoRes.rows[0]?.pedidos_cancelados ?? 0),
      ticket_medio: toNum(resumoRes.rows[0]?.ticket_medio),
    },
    porDia: porDiaRes.rows.map((r) => ({
      dia: r.dia instanceof Date ? r.dia.toISOString() : String(r.dia),
      total_pedidos: Number(r.total_pedidos),
      receita: toNum(r.receita),
    })),
  };
}

export async function fetchDadosEstoque(scope: StoreScope, filtro: FiltroEstoque) {
  const { pool, storeId } = scope;
  if (!FILTROS_ESTOQUE.includes(filtro)) {
    filtro = 'todos';
  }
  const condicao = FILTROS_ESTOQUE_VALIDOS[filtro];

  const [produtosRes, resumoRes] = await Promise.all([
    pool.query(
      `SELECT p.id, p.name AS nome, p.price AS valor, p.stock AS estoque, c.name AS categoria_nome
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id AND c.store_id = p.store_id
       WHERE p.store_id = $1 ${condicao}
       ORDER BY p.stock ASC NULLS LAST, p.name`,
      [storeId],
    ),
    pool.query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE stock IS NULL)::int AS ilimitados,
              COUNT(*) FILTER (WHERE stock IS NOT NULL AND stock > 5)::int AS ok,
              COUNT(*) FILTER (WHERE stock IS NOT NULL AND stock > 0 AND stock <= 5)::int AS baixo,
              COUNT(*) FILTER (WHERE stock = 0)::int AS esgotados
       FROM products WHERE store_id = $1`,
      [storeId],
    ),
  ]);

  return {
    produtos: produtosRes.rows.map((r) => ({
      ...r,
      valor: toNum(r.valor),
      estoque: r.estoque === null ? null : Number(r.estoque),
    })),
    resumo: {
      total: Number(resumoRes.rows[0]?.total ?? 0),
      ilimitados: Number(resumoRes.rows[0]?.ilimitados ?? 0),
      ok: Number(resumoRes.rows[0]?.ok ?? 0),
      baixo: Number(resumoRes.rows[0]?.baixo ?? 0),
      esgotados: Number(resumoRes.rows[0]?.esgotados ?? 0),
    },
  };
}

export async function fetchDadosEntregas(scope: StoreScope) {
  const { pool, storeId } = scope;
  const [statusRes, pedidosRes] = await Promise.all([
    pool.query(
      `SELECT status, COUNT(*)::int AS total, COALESCE(SUM(total), 0) AS valor
       FROM orders WHERE store_id = $1 GROUP BY status ORDER BY status`,
      [storeId],
    ),
    pool.query(
      `SELECT o.id, o.created_at, o.shipping_name AS nome_entrega, o.shipping_email AS email_entrega,
              o.shipping_city AS cidade, o.shipping_state AS estado, o.total, o.status,
              o.tracking_code AS codigo_rastreio, o.shipping_service AS frete_servico
       FROM orders o
       WHERE o.store_id = $1 AND o.status NOT IN ('delivered', 'cancelled')
       ORDER BY CASE o.status
         WHEN 'paid' THEN 1 WHEN 'in_separation' THEN 2 WHEN 'shipped' THEN 3
         WHEN 'awaiting_payment' THEN 4 ELSE 5 END, o.created_at DESC`,
      [storeId],
    ),
  ]);

  return {
    porStatus: statusRes.rows.map((r) => ({
      status: orderStatusToApi(String(r.status)),
      total: Number(r.total),
      valor: toNum(r.valor),
    })),
    pedidos: pedidosRes.rows.map((r) => ({
      ...r,
      status: orderStatusToApi(String(r.status)),
      total: toNum(r.total),
    })),
  };
}

export async function fetchDadosProdutos(scope: StoreScope, dataInicio: Date, dataFim: Date) {
  const { pool, storeId } = scope;
  const [topRes, categoriaRes] = await Promise.all([
    pool.query(
      `SELECT oi.product_name AS nome_produto,
              SUM(oi.quantity)::int AS total_vendido,
              ROUND(SUM(oi.subtotal), 2) AS receita_total,
              COUNT(DISTINCT oi.order_id)::int AS total_pedidos
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id AND o.store_id = oi.store_id
       WHERE o.store_id = $3 AND o.created_at BETWEEN $1 AND $2 AND o.status NOT IN ('cancelled')
       GROUP BY oi.product_name ORDER BY total_vendido DESC LIMIT 20`,
      [dataInicio, dataFim, storeId],
    ),
    pool.query(
      `SELECT COALESCE(c.name, 'Sem categoria') AS categoria,
              SUM(oi.quantity)::int AS total_vendido, ROUND(SUM(oi.subtotal), 2) AS receita_total
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id AND o.store_id = oi.store_id
       LEFT JOIN products pr ON pr.id = oi.product_id AND pr.store_id = oi.store_id
       LEFT JOIN categories c ON c.id = pr.category_id AND c.store_id = pr.store_id
       WHERE o.store_id = $3 AND o.created_at BETWEEN $1 AND $2 AND o.status NOT IN ('cancelled')
       GROUP BY c.name ORDER BY receita_total DESC`,
      [dataInicio, dataFim, storeId],
    ),
  ]);

  return {
    topProdutos: topRes.rows.map((r) => ({
      nome_produto: r.nome_produto as string,
      total_vendido: Number(r.total_vendido),
      receita_total: toNum(r.receita_total),
      total_pedidos: Number(r.total_pedidos),
    })),
    porCategoria: categoriaRes.rows.map((r) => ({
      categoria: r.categoria as string,
      total_vendido: Number(r.total_vendido),
      receita_total: toNum(r.receita_total),
    })),
  };
}

export async function fetchDadosFinanceiro(scope: StoreScope, dataInicio: Date, dataFim: Date) {
  const { pool, storeId } = scope;
  const [resumoRes, metodosRows, porDiaRows, porMesRes] = await Promise.all([
    pool.query(
      `SELECT COUNT(*) FILTER (WHERE status NOT IN ('cancelled'))::int AS total_pedidos,
              COALESCE(SUM(total) FILTER (WHERE status NOT IN ('cancelled','awaiting_payment')), 0) AS receita_total,
              COALESCE(SUM(shipping_fee) FILTER (WHERE status NOT IN ('cancelled')), 0) AS total_frete,
              CASE WHEN COUNT(*) FILTER (WHERE status NOT IN ('cancelled','awaiting_payment')) > 0
                   THEN ROUND(SUM(total) FILTER (WHERE status NOT IN ('cancelled','awaiting_payment'))
                        / COUNT(*) FILTER (WHERE status NOT IN ('cancelled','awaiting_payment')), 2)
                   ELSE 0 END AS ticket_medio
       FROM orders WHERE store_id = $3 AND created_at BETWEEN $1 AND $2`,
      [dataInicio, dataFim, storeId],
    ),
    fetchReceitaPorMetodo(scope, dataInicio, dataFim),
    fetchReceitaPorDia(scope, dataInicio, dataFim),
    pool.query(
      `SELECT DATE_TRUNC('month', created_at) AS mes,
              COUNT(*) FILTER (WHERE status NOT IN ('cancelled'))::int AS total_pedidos,
              ROUND(COALESCE(SUM(total) FILTER (WHERE status NOT IN ('cancelled','awaiting_payment')), 0), 2) AS receita
       FROM orders WHERE store_id = $1 AND created_at >= NOW() - INTERVAL '12 months'
       GROUP BY mes ORDER BY mes`,
      [storeId],
    ),
  ]);

  return {
    resumo: {
      total_pedidos: Number(resumoRes.rows[0]?.total_pedidos ?? 0),
      receita_total: toNum(resumoRes.rows[0]?.receita_total),
      total_frete: toNum(resumoRes.rows[0]?.total_frete),
      ticket_medio: toNum(resumoRes.rows[0]?.ticket_medio),
    },
    porMetodo: metodosRows.map((r) => ({
      metodo_pagamento: r.metodo,
      total_pedidos: r.pedidos,
      receita: r.receita,
    })),
    porDia: porDiaRows.map((r) => ({
      dia: r.dia,
      total_pedidos: r.pedidos,
      receita: r.receita,
    })),
    porMes: porMesRes.rows.map((r) => ({
      mes: r.mes instanceof Date ? r.mes.toISOString() : String(r.mes),
      total_pedidos: Number(r.total_pedidos),
      receita: toNum(r.receita),
    })),
  };
}

export async function fetchDadosClientes(scope: StoreScope, dataInicio: Date, dataFim: Date) {
  const { pool, storeId } = scope;
  const [topRes, novosRes, totalClientesRes] = await Promise.all([
    pool.query(
      `SELECT b.name AS nome, b.email, b.created_at AS membro_desde,
              COUNT(o.id)::int AS total_pedidos,
              ROUND(COALESCE(SUM(o.total) FILTER (WHERE o.status NOT IN ('cancelled')), 0), 2) AS total_gasto,
              MAX(o.created_at) AS ultimo_pedido
       FROM buyers b
       LEFT JOIN orders o ON o.buyer_id = b.id AND o.store_id = b.store_id
         AND o.created_at BETWEEN $2 AND $3
       WHERE b.store_id = $1
       GROUP BY b.id, b.name, b.email, b.created_at
       HAVING COUNT(o.id) > 0
       ORDER BY total_gasto DESC LIMIT 30`,
      [storeId, dataInicio, dataFim],
    ),
    pool.query(
      `SELECT DATE_TRUNC('day', created_at) AS dia, COUNT(*)::int AS novos
       FROM buyers WHERE store_id = $1 AND created_at BETWEEN $2 AND $3
       GROUP BY dia ORDER BY dia`,
      [storeId, dataInicio, dataFim],
    ),
    pool.query('SELECT COUNT(*)::int AS total FROM buyers WHERE store_id = $1', [storeId]),
  ]);

  return {
    topClientes: topRes.rows.map((r) => ({
      nome: r.nome as string,
      email: r.email as string,
      membro_desde: r.membro_desde instanceof Date ? r.membro_desde.toISOString() : String(r.membro_desde),
      total_pedidos: Number(r.total_pedidos),
      total_gasto: toNum(r.total_gasto),
      ultimo_pedido: r.ultimo_pedido instanceof Date ? r.ultimo_pedido.toISOString() : String(r.ultimo_pedido),
    })),
    novosPorDia: novosRes.rows.map((r) => ({
      dia: r.dia instanceof Date ? r.dia.toISOString() : String(r.dia),
      novos: Number(r.novos),
    })),
    totalClientes: Number(totalClientesRes.rows[0]?.total ?? 0),
  };
}

export async function fetchDadosAgendamentos(scope: StoreScope, dataInicio: Date, dataFim: Date) {
  const { pool, storeId } = scope;
  try {
    const [agendamentosRes, resumoRes, porMesRes] = await Promise.all([
      pool.query(
        `SELECT a.id, a.event_date AS data_evento, a.status AS status_agendamento,
                a.created_at AS data_agendamento, o.id AS pedido_id, o.created_at AS data_compra,
                o.total, o.status AS status_pedido, o.shipping_name AS cliente_nome,
                o.shipping_email AS email, o.shipping_phone AS telefone, b.id AS usuario_id,
                COALESCE(STRING_AGG(oi.product_name || ' ×' || oi.quantity, ', '), '') AS produtos
         FROM appointments a
         JOIN orders o ON o.id = a.order_id AND o.store_id = a.store_id
         JOIN buyers b ON b.id = o.buyer_id AND b.store_id = o.store_id
         LEFT JOIN order_items oi ON oi.order_id = o.id AND oi.store_id = o.store_id
         WHERE a.store_id = $3 AND a.event_date BETWEEN $1::date AND $2::date
         GROUP BY a.id, o.id, b.id ORDER BY a.event_date ASC`,
        [dataInicio, dataFim, storeId],
      ),
      pool.query(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE a.status = 'confirmed')::int AS confirmados,
                COUNT(*) FILTER (WHERE a.status = 'cancelled')::int AS cancelados,
                COALESCE(SUM(o.total) FILTER (WHERE a.status = 'confirmed'), 0) AS receita_confirmada
         FROM appointments a
         JOIN orders o ON o.id = a.order_id AND o.store_id = a.store_id
         WHERE a.store_id = $3 AND a.event_date BETWEEN $1::date AND $2::date`,
        [dataInicio, dataFim, storeId],
      ),
      pool.query(
        `SELECT DATE_TRUNC('month', a.event_date) AS mes,
                COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE a.status = 'confirmed')::int AS confirmados,
                COALESCE(SUM(o.total) FILTER (WHERE a.status = 'confirmed'), 0) AS receita
         FROM appointments a
         JOIN orders o ON o.id = a.order_id AND o.store_id = a.store_id
         WHERE a.store_id = $1 AND a.event_date >= NOW() - INTERVAL '12 months'
         GROUP BY mes ORDER BY mes`,
        [storeId],
      ),
    ]);

    return {
      agendamentos: agendamentosRes.rows.map((r) => ({
        ...r,
        data_evento: String(r.data_evento).slice(0, 10),
        status_agendamento: appointmentStatusToApi(String(r.status_agendamento)),
        status_pedido: orderStatusToApi(String(r.status_pedido)),
        total: toNum(r.total),
      })),
      resumo: {
        total: Number(resumoRes.rows[0]?.total ?? 0),
        confirmados: Number(resumoRes.rows[0]?.confirmados ?? 0),
        cancelados: Number(resumoRes.rows[0]?.cancelados ?? 0),
        receita_confirmada: toNum(resumoRes.rows[0]?.receita_confirmada),
      },
      porMes: porMesRes.rows.map((r) => ({
        mes: r.mes instanceof Date ? r.mes.toISOString() : String(r.mes),
        total: Number(r.total),
        confirmados: Number(r.confirmados),
        receita: toNum(r.receita),
      })),
    };
  } catch {
    return {
      agendamentos: [],
      resumo: { total: 0, confirmados: 0, cancelados: 0, receita_confirmada: 0 },
      porMes: [],
    };
  }
}
