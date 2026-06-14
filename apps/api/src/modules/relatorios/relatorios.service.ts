import type { FiltroEstoque, RelatorioAba, RelatorioCsvTipo } from '@lojao/types/relatorios';
import { FILTROS_ESTOQUE, STATUS_LABEL } from '@lojao/types/relatorios';
import type pg from 'pg';

import {
  fetchReceitaPorDia,
  fetchReceitaPorMetodo,
  toNum,
} from '../admin/order-analytics.js';

const FILTROS_ESTOQUE_VALIDOS: Record<FiltroEstoque, string> = {
  todos: '',
  esgotado: 'WHERE p.estoque = 0',
  baixo: 'WHERE p.estoque > 0 AND p.estoque <= 5',
  ok: 'WHERE p.estoque > 5',
  ilimitado: 'WHERE p.estoque IS NULL',
};

export interface RelatorioDateRange {
  dataInicio: Date;
  dataFim: Date;
  dataInicioStr: string;
  dataFimStr: string;
}

/** Porta `parseDatas` do legacy. */
export function parseRelatorioDatas(query: {
  inicio?: string;
  fim?: string;
}): RelatorioDateRange {
  const hoje = new Date();
  const inicio30 = new Date(hoje);
  inicio30.setDate(inicio30.getDate() - 29);

  const dataInicio = query.inicio ? new Date(`${query.inicio}T00:00:00`) : inicio30;
  const dataFim = query.fim
    ? new Date(`${query.fim}T23:59:59`)
    : new Date(new Date().setHours(23, 59, 59, 999));

  return {
    dataInicio,
    dataFim,
    dataInicioStr: dataInicio.toISOString().slice(0, 10),
    dataFimStr: dataFim.toISOString().slice(0, 10),
  };
}

function fmtDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('pt-BR');
}

export async function getRelatorioDados(
  db: pg.Pool,
  aba: RelatorioAba,
  range: RelatorioDateRange,
  filtroEstoque: FiltroEstoque,
): Promise<Record<string, unknown>> {
  if (aba === 'vendas') return getDadosVendas(db, range.dataInicio, range.dataFim);
  if (aba === 'estoque') return getDadosEstoque(db, filtroEstoque);
  if (aba === 'entregas') return getDadosEntregas(db);
  if (aba === 'produtos') return getDadosProdutos(db, range.dataInicio, range.dataFim);
  if (aba === 'financeiro') return getDadosFinanceiro(db, range.dataInicio, range.dataFim);
  if (aba === 'clientes') return getDadosClientes(db, range.dataInicio, range.dataFim);
  if (aba === 'agendamentos') return getDadosAgendamentos(db, range.dataInicio, range.dataFim);
  return {};
}

export async function buildRelatorioCsv(
  db: pg.Pool,
  tipo: RelatorioCsvTipo,
  range: RelatorioDateRange,
): Promise<{ csv: string; filename: string }> {
  let linhas: (string | number | null)[][] = [];
  let filename: string = tipo;

  if (tipo === 'vendas') {
    const d = await getDadosVendas(db, range.dataInicio, range.dataFim);
    const pedidos = d.pedidos as Array<Record<string, unknown>>;
    linhas = [
      ['ID', 'Data', 'Cliente', 'E-mail', 'Itens', 'Subtotal', 'Frete', 'Total', 'Pagamento', 'Status'],
      ...pedidos.map((p) => [
        p.id as number,
        fmtDate(p.created_at as string),
        p.cliente_nome as string,
        p.email_entrega as string,
        p.qtd_itens as number,
        p.subtotal as number,
        p.frete as number,
        p.total as number,
        (p.metodo_pagamento as string) || '',
        STATUS_LABEL[p.status as string] || (p.status as string),
      ]),
    ];
    filename = `vendas_${range.dataInicioStr}_${range.dataFimStr}`;
  } else if (tipo === 'estoque') {
    const d = await getDadosEstoque(db, 'todos');
    const produtos = d.produtos as Array<Record<string, unknown>>;
    linhas = [
      ['Produto', 'Categoria', 'Estoque', 'Status'],
      ...produtos.map((p) => [
        p.nome as string,
        (p.categoria_nome as string) || '—',
        p.estoque !== null ? (p.estoque as number) : 'Ilimitado',
        p.estoque === null
          ? 'Sem controle'
          : (p.estoque as number) === 0
            ? 'Esgotado'
            : (p.estoque as number) <= 5
              ? 'Estoque baixo'
              : 'OK',
      ]),
    ];
    filename = 'estoque';
  } else if (tipo === 'entregas') {
    const d = await getDadosEntregas(db);
    const pedidos = d.pedidos as Array<Record<string, unknown>>;
    linhas = [
      ['ID', 'Data', 'Cliente', 'Status', 'Rastreio', 'Cidade/UF', 'Total'],
      ...pedidos.map((p) => [
        p.id as number,
        fmtDate(p.created_at as string),
        p.nome_entrega as string,
        STATUS_LABEL[p.status as string] || (p.status as string),
        (p.codigo_rastreio as string) || '—',
        `${p.cidade || ''}/${p.estado || ''}`,
        p.total as number,
      ]),
    ];
    filename = 'entregas';
  } else if (tipo === 'produtos') {
    const d = await getDadosProdutos(db, range.dataInicio, range.dataFim);
    const top = d.topProdutos as Array<Record<string, unknown>>;
    linhas = [
      ['Produto', 'Qtd Vendida', 'Receita (R$)', 'Pedidos'],
      ...top.map((p) => [
        p.nome_produto as string,
        p.total_vendido as number,
        p.receita_total as number,
        p.total_pedidos as number,
      ]),
    ];
    filename = `produtos_${range.dataInicioStr}_${range.dataFimStr}`;
  } else if (tipo === 'financeiro') {
    const d = await getDadosFinanceiro(db, range.dataInicio, range.dataFim);
    const porMetodo = d.porMetodo as Array<Record<string, unknown>>;
    const porDia = d.porDia as Array<Record<string, unknown>>;
    linhas = [
      ['Método de Pagamento', 'Pedidos', 'Receita (R$)'],
      ...porMetodo.map((m) => [
        (m.metodo_pagamento as string) || 'N/A',
        m.total_pedidos as number,
        m.receita as number,
      ]),
      [],
      ['Data', 'Pedidos', 'Receita (R$)'],
      ...porDia.map((row) => [
        fmtDate(row.dia as string),
        row.total_pedidos as number,
        row.receita as number,
      ]),
    ];
    filename = `financeiro_${range.dataInicioStr}_${range.dataFimStr}`;
  } else if (tipo === 'clientes') {
    const d = await getDadosClientes(db, range.dataInicio, range.dataFim);
    const top = d.topClientes as Array<Record<string, unknown>>;
    linhas = [
      ['Cliente', 'E-mail', 'Pedidos', 'Total Gasto (R$)', 'Último Pedido'],
      ...top.map((c) => [
        c.nome as string,
        c.email as string,
        c.total_pedidos as number,
        c.total_gasto as number,
        fmtDate(c.ultimo_pedido as string),
      ]),
    ];
    filename = `clientes_${range.dataInicioStr}_${range.dataFimStr}`;
  } else if (tipo === 'agendamentos') {
    const d = await getDadosAgendamentos(db, range.dataInicio, range.dataFim);
    const agendamentos = d.agendamentos as Array<Record<string, unknown>>;
    linhas = [
      [
        'Pedido #',
        'Cliente',
        'E-mail',
        'Telefone',
        'Data da Compra',
        'Data Agendada',
        'Produtos',
        'Total (R$)',
        'Status Agendamento',
        'Status Pedido',
      ],
      ...agendamentos.map((a) => [
        a.pedido_id as number,
        a.cliente_nome as string,
        a.email as string,
        (a.telefone as string) || '',
        fmtDate(a.data_compra as string),
        fmtDate(`${String(a.data_evento).slice(0, 10)}T12:00:00`),
        a.produtos as string,
        a.total as number,
        a.status_agendamento === 'confirmado' ? 'Confirmado' : 'Cancelado',
        STATUS_LABEL[a.status_pedido as string] || (a.status_pedido as string),
      ]),
    ];
    filename = `agendamentos_${range.dataInicioStr}_${range.dataFimStr}`;
  }

  const BOM = '\uFEFF';
  const csv =
    BOM +
    linhas
      .map((l) => l.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';'))
      .join('\n');

  return { csv, filename };
}

async function getDadosVendas(db: pg.Pool, dataInicio: Date, dataFim: Date) {
  const [pedidosRes, resumoRes, porDiaRes] = await Promise.all([
    db.query(
      `SELECT p.id, p.created_at, p.nome_entrega, p.email_entrega,
              p.subtotal, p.frete, p.total, p.status, p.metodo_pagamento,
              u.nome AS cliente_nome,
              COUNT(pi.id)::int AS qtd_itens
       FROM pedidos p
       JOIN usuarios u ON u.id = p.usuario_id
       LEFT JOIN pedido_itens pi ON pi.pedido_id = p.id
       WHERE p.created_at BETWEEN $1 AND $2
       GROUP BY p.id, u.nome
       ORDER BY p.created_at DESC`,
      [dataInicio, dataFim],
    ),
    db.query(
      `SELECT
        COUNT(*)::int AS total_pedidos,
        COALESCE(SUM(total) FILTER (WHERE status NOT IN ('cancelado','aguardando_pagamento')), 0) AS receita_confirmada,
        COALESCE(SUM(total) FILTER (WHERE status = 'aguardando_pagamento'), 0) AS receita_pendente,
        COALESCE(SUM(total) FILTER (WHERE status = 'cancelado'), 0) AS receita_cancelada,
        COUNT(*) FILTER (WHERE status = 'cancelado')::int AS pedidos_cancelados,
        CASE WHEN COUNT(*) FILTER (WHERE status NOT IN ('cancelado','aguardando_pagamento')) > 0
             THEN ROUND(SUM(total) FILTER (WHERE status NOT IN ('cancelado','aguardando_pagamento'))
                  / COUNT(*) FILTER (WHERE status NOT IN ('cancelado','aguardando_pagamento')), 2)
             ELSE 0 END AS ticket_medio
       FROM pedidos
       WHERE created_at BETWEEN $1 AND $2`,
      [dataInicio, dataFim],
    ),
    db.query(
      `SELECT
        DATE_TRUNC('day', created_at) AS dia,
        COUNT(*)::int AS total_pedidos,
        COALESCE(SUM(total) FILTER (WHERE status NOT IN ('cancelado')), 0) AS receita
       FROM pedidos
       WHERE created_at BETWEEN $1 AND $2
       GROUP BY dia
       ORDER BY dia`,
      [dataInicio, dataFim],
    ),
  ]);

  return {
    pedidos: pedidosRes.rows.map((r) => ({
      ...r,
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

async function getDadosEstoque(db: pg.Pool, filtro: FiltroEstoque) {
  if (!FILTROS_ESTOQUE.includes(filtro)) {
    filtro = 'todos';
  }
  const condicao = FILTROS_ESTOQUE_VALIDOS[filtro];

  const [produtosRes, resumoRes] = await Promise.all([
    db.query(`
      SELECT p.id, p.nome, p.valor, p.estoque, c.nome AS categoria_nome
      FROM produtos p
      LEFT JOIN categorias c ON c.id = p.categoria_id
      ${condicao}
      ORDER BY p.estoque ASC NULLS LAST, p.nome
    `),
    db.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE estoque IS NULL)::int AS ilimitados,
        COUNT(*) FILTER (WHERE estoque IS NOT NULL AND estoque > 5)::int AS ok,
        COUNT(*) FILTER (WHERE estoque IS NOT NULL AND estoque > 0 AND estoque <= 5)::int AS baixo,
        COUNT(*) FILTER (WHERE estoque = 0)::int AS esgotados
      FROM produtos
    `),
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

async function getDadosEntregas(db: pg.Pool) {
  const [statusRes, pedidosRes] = await Promise.all([
    db.query(`
      SELECT status, COUNT(*)::int AS total, COALESCE(SUM(total), 0) AS valor
      FROM pedidos
      GROUP BY status
      ORDER BY status
    `),
    db.query(`
      SELECT p.id, p.created_at, p.nome_entrega, p.email_entrega,
             p.cidade, p.estado, p.total, p.status, p.codigo_rastreio,
             p.frete_servico
      FROM pedidos p
      WHERE p.status NOT IN ('entregue', 'cancelado')
      ORDER BY
        CASE p.status
          WHEN 'pago' THEN 1
          WHEN 'em_separacao' THEN 2
          WHEN 'enviado' THEN 3
          WHEN 'aguardando_pagamento' THEN 4
          ELSE 5
        END,
        p.created_at DESC
    `),
  ]);

  return {
    porStatus: statusRes.rows.map((r) => ({
      status: r.status as string,
      total: Number(r.total),
      valor: toNum(r.valor),
    })),
    pedidos: pedidosRes.rows.map((r) => ({ ...r, total: toNum(r.total) })),
  };
}

async function getDadosProdutos(db: pg.Pool, dataInicio: Date, dataFim: Date) {
  const [topRes, categoriaRes] = await Promise.all([
    db.query(
      `SELECT pi.nome_produto,
              SUM(pi.quantidade)::int AS total_vendido,
              ROUND(SUM(pi.subtotal), 2) AS receita_total,
              COUNT(DISTINCT pi.pedido_id)::int AS total_pedidos
       FROM pedido_itens pi
       JOIN pedidos p ON p.id = pi.pedido_id
       WHERE p.created_at BETWEEN $1 AND $2
         AND p.status NOT IN ('cancelado')
       GROUP BY pi.nome_produto
       ORDER BY total_vendido DESC
       LIMIT 20`,
      [dataInicio, dataFim],
    ),
    db.query(
      `SELECT COALESCE(c.nome, 'Sem categoria') AS categoria,
              SUM(pi.quantidade)::int AS total_vendido,
              ROUND(SUM(pi.subtotal), 2) AS receita_total
       FROM pedido_itens pi
       JOIN pedidos p ON p.id = pi.pedido_id
       LEFT JOIN produtos pr ON pr.id = pi.produto_id
       LEFT JOIN categorias c ON c.id = pr.categoria_id
       WHERE p.created_at BETWEEN $1 AND $2
         AND p.status NOT IN ('cancelado')
       GROUP BY c.nome
       ORDER BY receita_total DESC`,
      [dataInicio, dataFim],
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

async function getDadosFinanceiro(db: pg.Pool, dataInicio: Date, dataFim: Date) {
  const [resumoRes, metodosRows, porDiaRows, porMesRes] = await Promise.all([
    db.query(
      `SELECT
        COUNT(*) FILTER (WHERE status NOT IN ('cancelado'))::int AS total_pedidos,
        COALESCE(SUM(total) FILTER (WHERE status NOT IN ('cancelado','aguardando_pagamento')), 0) AS receita_total,
        COALESCE(SUM(frete) FILTER (WHERE status NOT IN ('cancelado')), 0) AS total_frete,
        CASE WHEN COUNT(*) FILTER (WHERE status NOT IN ('cancelado','aguardando_pagamento')) > 0
             THEN ROUND(SUM(total) FILTER (WHERE status NOT IN ('cancelado','aguardando_pagamento'))
                  / COUNT(*) FILTER (WHERE status NOT IN ('cancelado','aguardando_pagamento')), 2)
             ELSE 0 END AS ticket_medio
       FROM pedidos
       WHERE created_at BETWEEN $1 AND $2`,
      [dataInicio, dataFim],
    ),
    fetchReceitaPorMetodo(db, dataInicio, dataFim),
    fetchReceitaPorDia(db, dataInicio, dataFim),
    db.query(`
      SELECT DATE_TRUNC('month', created_at) AS mes,
             COUNT(*) FILTER (WHERE status NOT IN ('cancelado'))::int AS total_pedidos,
             ROUND(COALESCE(SUM(total) FILTER (WHERE status NOT IN ('cancelado','aguardando_pagamento')), 0), 2) AS receita
       FROM pedidos
       WHERE created_at >= NOW() - INTERVAL '12 months'
       GROUP BY mes ORDER BY mes
    `),
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

async function getDadosClientes(db: pg.Pool, dataInicio: Date, dataFim: Date) {
  const [topRes, novosRes, totalClientesRes] = await Promise.all([
    db.query(
      `SELECT u.nome, u.email, u.created_at AS membro_desde,
              COUNT(p.id)::int AS total_pedidos,
              ROUND(COALESCE(SUM(p.total) FILTER (WHERE p.status NOT IN ('cancelado')), 0), 2) AS total_gasto,
              MAX(p.created_at) AS ultimo_pedido
       FROM usuarios u
       LEFT JOIN pedidos p ON p.usuario_id = u.id
         AND p.created_at BETWEEN $1 AND $2
       WHERE u.role = 'usuario'
       GROUP BY u.id, u.nome, u.email, u.created_at
       HAVING COUNT(p.id) > 0
       ORDER BY total_gasto DESC
       LIMIT 30`,
      [dataInicio, dataFim],
    ),
    db.query(
      `SELECT DATE_TRUNC('day', created_at) AS dia, COUNT(*)::int AS novos
       FROM usuarios
       WHERE role = 'usuario' AND created_at BETWEEN $1 AND $2
       GROUP BY dia ORDER BY dia`,
      [dataInicio, dataFim],
    ),
    db.query("SELECT COUNT(*)::int AS total FROM usuarios WHERE role = 'usuario'"),
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

async function getDadosAgendamentos(db: pg.Pool, dataInicio: Date, dataFim: Date) {
  try {
    const [agendamentosRes, resumoRes, porMesRes] = await Promise.all([
      db.query(
        `SELECT
          a.id,
          a.data_evento,
          a.status AS status_agendamento,
          a.created_at AS data_agendamento,
          p.id AS pedido_id,
          p.created_at AS data_compra,
          p.total,
          p.status AS status_pedido,
          p.nome_entrega AS cliente_nome,
          p.email_entrega AS email,
          p.telefone_entrega AS telefone,
          u.id AS usuario_id,
          COALESCE(
            STRING_AGG(pi.nome_produto || ' ×' || pi.quantidade, ', '),
            ''
          ) AS produtos
         FROM agendamentos a
         JOIN pedidos p ON p.id = a.pedido_id
         JOIN usuarios u ON u.id = p.usuario_id
         LEFT JOIN pedido_itens pi ON pi.pedido_id = p.id
         WHERE a.data_evento BETWEEN $1::date AND $2::date
         GROUP BY a.id, p.id, u.id
         ORDER BY a.data_evento ASC`,
        [dataInicio, dataFim],
      ),
      db.query(
        `SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE a.status = 'confirmado')::int AS confirmados,
          COUNT(*) FILTER (WHERE a.status = 'cancelado')::int AS cancelados,
          COALESCE(SUM(p.total) FILTER (WHERE a.status = 'confirmado'), 0) AS receita_confirmada
         FROM agendamentos a
         JOIN pedidos p ON p.id = a.pedido_id
         WHERE a.data_evento BETWEEN $1::date AND $2::date`,
        [dataInicio, dataFim],
      ),
      db.query(`
        SELECT
          DATE_TRUNC('month', a.data_evento) AS mes,
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE a.status = 'confirmado')::int AS confirmados,
          COALESCE(SUM(p.total) FILTER (WHERE a.status = 'confirmado'), 0) AS receita
         FROM agendamentos a
         JOIN pedidos p ON p.id = a.pedido_id
         WHERE a.data_evento >= NOW() - INTERVAL '12 months'
         GROUP BY mes ORDER BY mes
      `),
    ]);

    return {
      agendamentos: agendamentosRes.rows.map((r) => ({
        ...r,
        data_evento: String(r.data_evento).slice(0, 10),
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
