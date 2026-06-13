import type { PedidoDetalhe, PedidoRecente, UpdatePedidoStatusInput } from '@lojao/types/pedidos';
import type { TenantDatabase } from '@lojao/db';
import { count, desc, eq, pedidos, sql, usuarios } from '@lojao/db';
import type pg from 'pg';

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
 * para os 4 cards da Fase 2. (Tabela `produtos` não tem flag `ativo`, então
 * `produtos_ativos` = total de produtos, igual ao card do legacy.)
 */
export async function getDashboardStats(db: pg.Pool): Promise<DashboardStats> {
  const [hoje, pendentes, receita, produtos, categorias, banners, totalPedidos, receitaTotal, recentes] =
    await Promise.all([
      db.query<{ c: number }>(
        "SELECT COUNT(*)::int AS c FROM pedidos WHERE created_at::date = CURRENT_DATE",
      ),
      db.query<{ c: number }>(
        "SELECT COUNT(*)::int AS c FROM pedidos WHERE status = 'aguardando_pagamento'",
      ),
      db.query<{ s: string }>(
        "SELECT COALESCE(SUM(total), 0) AS s FROM pedidos WHERE status = 'pago' AND created_at >= date_trunc('month', CURRENT_DATE)",
      ),
      db.query<{ c: number }>('SELECT COUNT(*)::int AS c FROM produtos'),
      db.query<{ c: number }>('SELECT COUNT(*)::int AS c FROM categorias').catch(() => ({ rows: [{ c: 0 }] })),
      db.query<{ c: number }>("SELECT COUNT(*)::int AS c FROM banners WHERE ativo = true").catch(() => ({ rows: [{ c: 0 }] })),
      db.query<{ c: number }>('SELECT COUNT(*)::int AS c FROM pedidos'),
      db.query<{ s: string }>(
        "SELECT COALESCE(SUM(total), 0) AS s FROM pedidos WHERE status = 'pago'",
      ),
      db.query(
        `SELECT p.id, p.status, p.total, p.created_at, p.metodo_pagamento,
                u.nome AS cliente_nome
         FROM pedidos p
         JOIN usuarios u ON u.id = p.usuario_id
         ORDER BY p.created_at DESC
         LIMIT 5`,
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
      status: String(r.status),
      total: Number(r.total),
      created_at: String(r.created_at),
      metodo_pagamento: (r.metodo_pagamento as string | null) ?? null,
      cliente_nome: String(r.cliente_nome),
    })),
  };
}

/** Lista paginada de pedidos (read-only) com dados do cliente — Drizzle. */
export async function listPedidos(
  db: TenantDatabase,
  { page, perPage, status }: PedidosQuery,
): Promise<{ data: PedidoResumo[]; total: number }> {
  const offset = (page - 1) * perPage;

  const totalQuery = status
    ? db.select({ total: count() }).from(pedidos).where(eq(pedidos.status, status))
    : db.select({ total: count() }).from(pedidos);

  const [totalRow] = await totalQuery;
  const total = Number(totalRow?.total ?? 0);

  const rowsRes = status
    ? await db
        .select({
          id: pedidos.id,
          createdAt: pedidos.createdAt,
          status: pedidos.status,
          total: pedidos.total,
          metodoPagamento: pedidos.metodoPagamento,
          clienteNome: usuarios.nome,
          clienteEmail: usuarios.email,
          totalItens: sql<number>`(
            SELECT COUNT(*)::int FROM pedido_itens pi WHERE pi.pedido_id = ${pedidos.id}
          )`.as('total_itens'),
        })
        .from(pedidos)
        .innerJoin(usuarios, eq(usuarios.id, pedidos.usuarioId))
        .where(eq(pedidos.status, status))
        .orderBy(desc(pedidos.createdAt))
        .limit(perPage)
        .offset(offset)
    : await db
        .select({
          id: pedidos.id,
          createdAt: pedidos.createdAt,
          status: pedidos.status,
          total: pedidos.total,
          metodoPagamento: pedidos.metodoPagamento,
          clienteNome: usuarios.nome,
          clienteEmail: usuarios.email,
          totalItens: sql<number>`(
            SELECT COUNT(*)::int FROM pedido_itens pi WHERE pi.pedido_id = ${pedidos.id}
          )`.as('total_itens'),
        })
        .from(pedidos)
        .innerJoin(usuarios, eq(usuarios.id, pedidos.usuarioId))
        .orderBy(desc(pedidos.createdAt))
        .limit(perPage)
        .offset(offset);

  const data: PedidoResumo[] = rowsRes.map((row) => ({
    id: row.id,
    created_at:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt ?? ''),
    status: row.status,
    total: Number(row.total),
    metodo_pagamento: row.metodoPagamento,
    total_itens: Number(row.totalItens ?? 0),
    cliente_nome: row.clienteNome,
    cliente_email: row.clienteEmail,
  }));

  return { data, total };
}

/** Porta `checkoutController.adminDetalhePedido`. */
export async function getPedidoById(db: pg.Pool, id: number): Promise<PedidoDetalhe | null> {
  const pedidoRes = await db.query(
    `SELECT p.*, u.nome AS usuario_nome, u.email AS usuario_email
     FROM pedidos p
     JOIN usuarios u ON u.id = p.usuario_id
     WHERE p.id = $1`,
    [id],
  );
  const row = pedidoRes.rows[0];
  if (!row) return null;

  const itensRes = await db.query(
    'SELECT id, produto_id, nome_produto, quantidade, preco_unitario, subtotal FROM pedido_itens WHERE pedido_id = $1 ORDER BY id',
    [id],
  );

  let pagamento: PedidoDetalhe['pagamento'] = null;
  try {
    const pagRes = await db.query(
      'SELECT id, mp_payment_id, status, status_mp, metodo FROM pagamentos WHERE pedido_id = $1 ORDER BY id DESC LIMIT 1',
      [id],
    );
    if (pagRes.rows[0]) {
      pagamento = {
        id: Number(pagRes.rows[0].id),
        mp_payment_id: (pagRes.rows[0].mp_payment_id as string | null) ?? null,
        status: String(pagRes.rows[0].status),
        status_mp: (pagRes.rows[0].status_mp as string | null) ?? null,
        metodo: (pagRes.rows[0].metodo as string | null) ?? null,
      };
    }
  } catch {
    pagamento = null;
  }

  return {
    id: Number(row.id),
    status: row.status as PedidoDetalhe['status'],
    subtotal: Number(row.subtotal ?? 0),
    frete: Number(row.frete ?? 0),
    total: Number(row.total ?? 0),
    metodo_pagamento: (row.metodo_pagamento as string | null) ?? null,
    codigo_rastreio: (row.codigo_rastreio as string | null) ?? null,
    created_at: String(row.created_at),
    usuario_nome: String(row.usuario_nome),
    usuario_email: String(row.usuario_email),
    nome_entrega: (row.nome_entrega as string | null) ?? null,
    email_entrega: (row.email_entrega as string | null) ?? null,
    telefone_entrega: (row.telefone_entrega as string | null) ?? null,
    cpf_entrega: (row.cpf_entrega as string | null) ?? null,
    cep: (row.cep as string | null) ?? null,
    logradouro: (row.logradouro as string | null) ?? null,
    numero: (row.numero as string | null) ?? null,
    complemento: (row.complemento as string | null) ?? null,
    bairro: (row.bairro as string | null) ?? null,
    cidade: (row.cidade as string | null) ?? null,
    estado: (row.estado as string | null) ?? null,
    itens: itensRes.rows.map((i) => ({
      id: Number(i.id),
      produto_id: i.produto_id === null ? null : Number(i.produto_id),
      nome_produto: String(i.nome_produto),
      quantidade: Number(i.quantidade),
      preco_unitario: Number(i.preco_unitario),
      subtotal: Number(i.subtotal),
    })),
    pagamento,
  };
}

/** Porta `checkoutController.adminAtualizarStatus` (sem e-mail — ver STATUS). */
export async function updatePedidoStatus(
  db: pg.Pool,
  id: number,
  input: UpdatePedidoStatusInput,
): Promise<PedidoDetalhe | null> {
  const rastreio = input.codigo_rastreio?.trim() || null;

  await db.query(
    `UPDATE pedidos
     SET status = $1,
         codigo_rastreio = COALESCE($2, codigo_rastreio)
     WHERE id = $3`,
    [input.status, rastreio, id],
  );

  return getPedidoById(db, id);
}
