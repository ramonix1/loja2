const { getConfigs } = require('./configController');

// Validação segura de filtros de estoque
const FILTROS_ESTOQUE_VALIDOS = {
  todos: '',
  esgotado: 'WHERE p.estoque = 0',
  baixo: 'WHERE p.estoque > 0 AND p.estoque <= 5',
  ok: 'WHERE p.estoque > 5',
  ilimitado: 'WHERE p.estoque IS NULL',
};

const STATUS_LABEL = {
  aguardando_pagamento: 'Aguardando pagamento',
  pago: 'Pago',
  em_separacao: 'Em separação',
  enviado: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

function parseDatas(query) {
  const hoje = new Date();
  const inicio30 = new Date(hoje);
  inicio30.setDate(inicio30.getDate() - 29);

  const dataInicio = query.inicio
    ? new Date(query.inicio + 'T00:00:00')
    : inicio30;
  const dataFim = query.fim
    ? new Date(query.fim + 'T23:59:59')
    : new Date(hoje.setHours(23, 59, 59));

  return { dataInicio, dataFim };
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('pt-BR');
}

function fmtMoeda(v) {
  return 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',');
}

// ── GET /admin/relatorios ─────────────────────────────────────────────────────
exports.index = async (req, res) => {
  const aba = req.query.aba || 'vendas';
  const { dataInicio, dataFim } = parseDatas(req.query);
  const db = req.db;
  const configs = await getConfigs(db);

  let dados = {};

  try {
    if (aba === 'vendas') {
      dados = await getDadosVendas(db, dataInicio, dataFim);
    } else if (aba === 'estoque') {
      dados = await getDadosEstoque(db, req.query.filtro_estoque || 'todos');
    } else if (aba === 'entregas') {
      dados = await getDadosEntregas(db);
    } else if (aba === 'produtos') {
      dados = await getDadosProdutos(db, dataInicio, dataFim);
    } else if (aba === 'financeiro') {
      dados = await getDadosFinanceiro(db, dataInicio, dataFim);
    } else if (aba === 'clientes') {
      dados = await getDadosClientes(db, dataInicio, dataFim);
    }
  } catch (err) {
    console.error('[Relatorios] Erro:', err.message);
    dados = { erro: err.message };
  }

  res.render('pages/admin-relatorios', {
    activePage: 'relatorios',
    aba,
    dados,
    configs,
    dataInicio: dataInicio.toISOString().slice(0, 10),
    dataFim: dataFim.toISOString().slice(0, 10),
    filtroEstoque: req.query.filtro_estoque || 'todos',
    STATUS_LABEL,
  });
};

// ── GET /admin/relatorios/csv/:tipo ───────────────────────────────────────────
exports.exportarCsv = async (req, res) => {
  const { tipo } = req.params;
  const { dataInicio, dataFim } = parseDatas(req.query);
  const db = req.db;

  try {
    let linhas = [];
    let filename = tipo;

    if (tipo === 'vendas') {
      const d = await getDadosVendas(db, dataInicio, dataFim);
      linhas = [
        ['ID', 'Data', 'Cliente', 'E-mail', 'Itens', 'Subtotal', 'Frete', 'Total', 'Pagamento', 'Status'],
        ...d.pedidos.map(p => [
          p.id,
          fmtDate(p.created_at),
          p.cliente_nome,
          p.email_entrega,
          p.qtd_itens,
          p.subtotal,
          p.frete,
          p.total,
          p.metodo_pagamento || '',
          STATUS_LABEL[p.status] || p.status,
        ]),
      ];
      filename = `vendas_${dataInicio.toISOString().slice(0,10)}_${dataFim.toISOString().slice(0,10)}`;

    } else if (tipo === 'estoque') {
      const d = await getDadosEstoque(db, 'todos');
      linhas = [
        ['Produto', 'Categoria', 'Estoque', 'Status'],
        ...d.produtos.map(p => [
          p.nome,
          p.categoria_nome || '—',
          p.estoque !== null ? p.estoque : 'Ilimitado',
          p.estoque === null ? 'Sem controle' : p.estoque === 0 ? 'Esgotado' : p.estoque <= 5 ? 'Estoque baixo' : 'OK',
        ]),
      ];
      filename = 'estoque';

    } else if (tipo === 'entregas') {
      const d = await getDadosEntregas(db);
      linhas = [
        ['ID', 'Data', 'Cliente', 'Status', 'Rastreio', 'Cidade/UF', 'Total'],
        ...d.pedidos.map(p => [
          p.id,
          fmtDate(p.created_at),
          p.nome_entrega,
          STATUS_LABEL[p.status] || p.status,
          p.codigo_rastreio || '—',
          `${p.cidade || ''}/${p.estado || ''}`,
          p.total,
        ]),
      ];
      filename = 'entregas';

    } else if (tipo === 'produtos') {
      const d = await getDadosProdutos(db, dataInicio, dataFim);
      linhas = [
        ['Produto', 'Qtd Vendida', 'Receita (R$)', 'Pedidos'],
        ...d.topProdutos.map(p => [p.nome_produto, p.total_vendido, p.receita_total, p.total_pedidos]),
      ];
      filename = `produtos_${dataInicio.toISOString().slice(0,10)}_${dataFim.toISOString().slice(0,10)}`;

    } else if (tipo === 'financeiro') {
      const d = await getDadosFinanceiro(db, dataInicio, dataFim);
      linhas = [
        ['Método de Pagamento', 'Pedidos', 'Receita (R$)'],
        ...d.porMetodo.map(m => [m.metodo_pagamento || 'N/A', m.total_pedidos, m.receita]),
        [], ['Data', 'Pedidos', 'Receita (R$)'],
        ...d.porDia.map(d => [fmtDate(d.dia), d.total_pedidos, d.receita]),
      ];
      filename = `financeiro_${dataInicio.toISOString().slice(0,10)}_${dataFim.toISOString().slice(0,10)}`;

    } else if (tipo === 'clientes') {
      const d = await getDadosClientes(db, dataInicio, dataFim);
      linhas = [
        ['Cliente', 'E-mail', 'Pedidos', 'Total Gasto (R$)', 'Último Pedido'],
        ...d.topClientes.map(c => [c.nome, c.email, c.total_pedidos, c.total_gasto, fmtDate(c.ultimo_pedido)]),
      ];
      filename = `clientes_${dataInicio.toISOString().slice(0,10)}_${dataFim.toISOString().slice(0,10)}`;
    }

    const BOM = '﻿';
    const csv = BOM + linhas
      .map(l => l.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';'))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    res.send(csv);

  } catch (err) {
    console.error('[Relatorios CSV] Erro:', err.message);
    res.status(500).send('Erro ao gerar CSV: ' + err.message);
  }
};

// ── Dados por relatório ───────────────────────────────────────────────────────

async function getDadosVendas(db, dataInicio, dataFim) {
  const [pedidosRes, resumoRes, porDiaRes] = await Promise.all([
    db.query(`
      SELECT p.id, p.created_at, p.nome_entrega, p.email_entrega,
             p.subtotal, p.frete, p.total, p.status, p.metodo_pagamento,
             u.nome AS cliente_nome,
             COUNT(pi.id) AS qtd_itens
      FROM pedidos p
      JOIN usuarios u ON u.id = p.usuario_id
      LEFT JOIN pedido_itens pi ON pi.pedido_id = p.id
      WHERE p.created_at BETWEEN $1 AND $2
      GROUP BY p.id, u.nome
      ORDER BY p.created_at DESC
    `, [dataInicio, dataFim]),

    db.query(`
      SELECT
        COUNT(*) AS total_pedidos,
        COALESCE(SUM(total) FILTER (WHERE status NOT IN ('cancelado','aguardando_pagamento')), 0) AS receita_confirmada,
        COALESCE(SUM(total) FILTER (WHERE status = 'aguardando_pagamento'), 0) AS receita_pendente,
        COALESCE(SUM(total) FILTER (WHERE status = 'cancelado'), 0) AS receita_cancelada,
        COUNT(*) FILTER (WHERE status = 'cancelado') AS pedidos_cancelados,
        CASE WHEN COUNT(*) FILTER (WHERE status NOT IN ('cancelado','aguardando_pagamento')) > 0
             THEN ROUND(SUM(total) FILTER (WHERE status NOT IN ('cancelado','aguardando_pagamento'))
                  / COUNT(*) FILTER (WHERE status NOT IN ('cancelado','aguardando_pagamento')), 2)
             ELSE 0 END AS ticket_medio
      FROM pedidos
      WHERE created_at BETWEEN $1 AND $2
    `, [dataInicio, dataFim]),

    db.query(`
      SELECT
        DATE_TRUNC('day', created_at) AS dia,
        COUNT(*) AS total_pedidos,
        COALESCE(SUM(total) FILTER (WHERE status NOT IN ('cancelado')), 0) AS receita
      FROM pedidos
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY dia
      ORDER BY dia
    `, [dataInicio, dataFim]),
  ]);

  return {
    pedidos: pedidosRes.rows,
    resumo: resumoRes.rows[0],
    porDia: porDiaRes.rows,
  };
}

async function getDadosEstoque(db, filtro) {
  // Whitelist validation — rejeita valores não esperados
  const condicao = FILTROS_ESTOQUE_VALIDOS[filtro] || FILTROS_ESTOQUE_VALIDOS['todos'];
  if (!FILTROS_ESTOQUE_VALIDOS.hasOwnProperty(filtro)) {
    console.warn(`⚠️ Filtro de estoque inválido recebido: ${filtro}`);
  }

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
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE estoque IS NULL) AS ilimitados,
        COUNT(*) FILTER (WHERE estoque IS NOT NULL AND estoque > 5) AS ok,
        COUNT(*) FILTER (WHERE estoque IS NOT NULL AND estoque > 0 AND estoque <= 5) AS baixo,
        COUNT(*) FILTER (WHERE estoque = 0) AS esgotados
      FROM produtos
    `),
  ]);

  return { produtos: produtosRes.rows, resumo: resumoRes.rows[0] };
}

async function getDadosEntregas(db) {
  const [statusRes, pedidosRes] = await Promise.all([
    db.query(`
      SELECT status, COUNT(*) AS total, COALESCE(SUM(total), 0) AS valor
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

  return { porStatus: statusRes.rows, pedidos: pedidosRes.rows };
}

async function getDadosProdutos(db, dataInicio, dataFim) {
  const [topRes, categoriaRes] = await Promise.all([
    db.query(`
      SELECT pi.nome_produto,
             SUM(pi.quantidade)::int   AS total_vendido,
             ROUND(SUM(pi.subtotal), 2) AS receita_total,
             COUNT(DISTINCT pi.pedido_id)::int AS total_pedidos
      FROM pedido_itens pi
      JOIN pedidos p ON p.id = pi.pedido_id
      WHERE p.created_at BETWEEN $1 AND $2
        AND p.status NOT IN ('cancelado')
      GROUP BY pi.nome_produto
      ORDER BY total_vendido DESC
      LIMIT 20
    `, [dataInicio, dataFim]),

    db.query(`
      SELECT COALESCE(c.nome, 'Sem categoria') AS categoria,
             SUM(pi.quantidade)::int AS total_vendido,
             ROUND(SUM(pi.subtotal), 2) AS receita_total
      FROM pedido_itens pi
      JOIN pedidos p ON p.id = pi.pedido_id
      LEFT JOIN produtos pr ON pr.id = pi.produto_id
      LEFT JOIN categorias c ON c.id = pr.categoria_id
      WHERE p.created_at BETWEEN $1 AND $2
        AND p.status NOT IN ('cancelado')
      GROUP BY c.nome
      ORDER BY receita_total DESC
    `, [dataInicio, dataFim]),
  ]);

  return { topProdutos: topRes.rows, porCategoria: categoriaRes.rows };
}

async function getDadosFinanceiro(db, dataInicio, dataFim) {
  const [resumoRes, metodosRes, porDiaRes, porMesRes] = await Promise.all([
    db.query(`
      SELECT
        COUNT(*) FILTER (WHERE status NOT IN ('cancelado')) AS total_pedidos,
        COALESCE(SUM(total) FILTER (WHERE status NOT IN ('cancelado','aguardando_pagamento')), 0) AS receita_total,
        COALESCE(SUM(frete) FILTER (WHERE status NOT IN ('cancelado')), 0) AS total_frete,
        CASE WHEN COUNT(*) FILTER (WHERE status NOT IN ('cancelado','aguardando_pagamento')) > 0
             THEN ROUND(SUM(total) FILTER (WHERE status NOT IN ('cancelado','aguardando_pagamento'))
                  / COUNT(*) FILTER (WHERE status NOT IN ('cancelado','aguardando_pagamento')), 2)
             ELSE 0 END AS ticket_medio
      FROM pedidos
      WHERE created_at BETWEEN $1 AND $2
    `, [dataInicio, dataFim]),

    db.query(`
      SELECT COALESCE(metodo_pagamento, 'N/A') AS metodo_pagamento,
             COUNT(*) AS total_pedidos,
             ROUND(COALESCE(SUM(total) FILTER (WHERE status NOT IN ('cancelado','aguardando_pagamento')), 0), 2) AS receita
      FROM pedidos
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY metodo_pagamento
      ORDER BY receita DESC
    `, [dataInicio, dataFim]),

    db.query(`
      SELECT DATE_TRUNC('day', created_at) AS dia,
             COUNT(*) FILTER (WHERE status NOT IN ('cancelado')) AS total_pedidos,
             ROUND(COALESCE(SUM(total) FILTER (WHERE status NOT IN ('cancelado','aguardando_pagamento')), 0), 2) AS receita
      FROM pedidos
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY dia ORDER BY dia
    `, [dataInicio, dataFim]),

    db.query(`
      SELECT DATE_TRUNC('month', created_at) AS mes,
             COUNT(*) FILTER (WHERE status NOT IN ('cancelado')) AS total_pedidos,
             ROUND(COALESCE(SUM(total) FILTER (WHERE status NOT IN ('cancelado','aguardando_pagamento')), 0), 2) AS receita
      FROM pedidos
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY mes ORDER BY mes
    `),
  ]);

  return {
    resumo: resumoRes.rows[0],
    porMetodo: metodosRes.rows,
    porDia: porDiaRes.rows,
    porMes: porMesRes.rows,
  };
}

async function getDadosClientes(db, dataInicio, dataFim) {
  const [topRes, novosRes] = await Promise.all([
    db.query(`
      SELECT u.nome, u.email, u.created_at AS membro_desde,
             COUNT(p.id) AS total_pedidos,
             ROUND(COALESCE(SUM(p.total) FILTER (WHERE p.status NOT IN ('cancelado')), 0), 2) AS total_gasto,
             MAX(p.created_at) AS ultimo_pedido
      FROM usuarios u
      LEFT JOIN pedidos p ON p.usuario_id = u.id
        AND p.created_at BETWEEN $1 AND $2
      WHERE u.role = 'usuario'
      GROUP BY u.id, u.nome, u.email, u.created_at
      HAVING COUNT(p.id) > 0
      ORDER BY total_gasto DESC
      LIMIT 30
    `, [dataInicio, dataFim]),

    db.query(`
      SELECT DATE_TRUNC('day', created_at) AS dia, COUNT(*) AS novos
      FROM usuarios
      WHERE role = 'usuario' AND created_at BETWEEN $1 AND $2
      GROUP BY dia ORDER BY dia
    `, [dataInicio, dataFim]),
  ]);

  const totalClientesRes = await db.query(
    "SELECT COUNT(*) AS total FROM usuarios WHERE role = 'usuario'"
  );

  return {
    topClientes: topRes.rows,
    novosPorDia: novosRes.rows,
    totalClientes: totalClientesRes.rows[0]?.total || 0,
  };
}
