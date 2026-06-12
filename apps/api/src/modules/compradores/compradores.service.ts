import type pg from 'pg';

import type {
  CompradorDetail,
  CompradorDetailResponse,
  CompradorListItem,
  CompradoresTotais,
  ListCompradoresQuery,
} from '@lojao/types/compradores';

function toIso(value: Date | string | null | undefined): string | null {
  if (value == null) return null;
  return value instanceof Date ? value.toISOString() : String(value);
}

function mapListRow(row: {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  cpf: string | null;
  cidade: string | null;
  estado: string | null;
  ativo: boolean;
  created_at: Date | string;
  ultimo_acesso: Date | string | null;
  total_pedidos: string | number;
  total_gasto: string | number;
}): CompradorListItem {
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    telefone: row.telefone,
    cpf: row.cpf,
    cidade: row.cidade,
    estado: row.estado,
    ativo: row.ativo,
    created_at: toIso(row.created_at) ?? '',
    ultimo_acesso: toIso(row.ultimo_acesso),
    total_pedidos: Number(row.total_pedidos),
    total_gasto: Number(row.total_gasto),
  };
}

/** Porta `compradorController.listar`. */
export async function listCompradores(
  db: pg.Pool,
  query: ListCompradoresQuery,
): Promise<{ compradores: CompradorListItem[]; totais: CompradoresTotais }> {
  const busca = query.busca?.trim() ?? '';

  let listSql: string;
  let params: string[];

  if (busca) {
    listSql = `
      SELECT u.id, u.nome, u.email, u.telefone, u.cpf, u.cidade, u.estado,
             u.ativo, u.created_at, u.ultimo_acesso,
             COUNT(p.id) AS total_pedidos,
             COALESCE(SUM(p.total) FILTER (WHERE p.status NOT IN ('cancelado')), 0) AS total_gasto
      FROM usuarios u
      LEFT JOIN pedidos p ON p.usuario_id = u.id
      WHERE u.role = 'usuario'
        AND (u.nome ILIKE $1 OR u.email ILIKE $1 OR u.cpf ILIKE $1 OR u.telefone ILIKE $1)
      GROUP BY u.id ORDER BY u.created_at DESC
    `;
    params = [`%${busca}%`];
  } else {
    listSql = `
      SELECT u.id, u.nome, u.email, u.telefone, u.cpf, u.cidade, u.estado,
             u.ativo, u.created_at, u.ultimo_acesso,
             COUNT(p.id) AS total_pedidos,
             COALESCE(SUM(p.total) FILTER (WHERE p.status NOT IN ('cancelado')), 0) AS total_gasto
      FROM usuarios u
      LEFT JOIN pedidos p ON p.usuario_id = u.id
      WHERE u.role = 'usuario'
      GROUP BY u.id ORDER BY u.created_at DESC
    `;
    params = [];
  }

  const [compradoresRes, totaisRes] = await Promise.all([
    db.query(listSql, params),
    db.query(`
      SELECT
        COUNT(*)::int AS total_compradores,
        COUNT(*) FILTER (WHERE ativo = true)::int AS ativos,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int AS novos_mes
      FROM usuarios WHERE role = 'usuario'
    `),
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
  db: pg.Pool,
  id: number,
): Promise<CompradorDetailResponse | null> {
  const [usuarioRes, pedidosRes, agendamentosRes, totalRes] = await Promise.all([
    db.query(`SELECT * FROM usuarios WHERE id = $1 AND role = 'usuario'`, [id]),
    db.query(
      `SELECT p.*,
              COUNT(pi.id)::int AS qtd_itens,
              COALESCE(
                JSON_AGG(
                  JSON_BUILD_OBJECT(
                    'nome', pi.nome_produto,
                    'quantidade', pi.quantidade,
                    'preco_unitario', pi.preco_unitario,
                    'subtotal', pi.subtotal
                  ) ORDER BY pi.id
                ) FILTER (WHERE pi.id IS NOT NULL),
                '[]'::json
              ) AS itens
       FROM pedidos p
       LEFT JOIN pedido_itens pi ON pi.pedido_id = p.id
       WHERE p.usuario_id = $1
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [id],
    ),
    db.query(
      `SELECT a.*, p.id AS pedido_id, p.total AS pedido_total,
              p.nome_entrega, p.status AS pedido_status
       FROM agendamentos a
       JOIN pedidos p ON p.id = a.pedido_id
       WHERE p.usuario_id = $1
       ORDER BY a.data_evento DESC`,
      [id],
    ).catch(() => ({ rows: [] as Record<string, unknown>[] })),
    db.query(
      `SELECT
         COUNT(*)::int AS total_pedidos,
         COALESCE(SUM(total) FILTER (WHERE status NOT IN ('cancelado')), 0) AS total_gasto,
         COALESCE(SUM(total) FILTER (WHERE status = 'cancelado'), 0) AS total_cancelado,
         MAX(created_at) AS ultimo_pedido
       FROM pedidos WHERE usuario_id = $1`,
      [id],
    ),
  ]);

  const usuarioRow = usuarioRes.rows[0];
  if (!usuarioRow) return null;

  const comprador: CompradorDetail = {
    id: usuarioRow.id as number,
    nome: usuarioRow.nome as string,
    email: usuarioRow.email as string,
    telefone: (usuarioRow.telefone as string | null) ?? null,
    cpf: (usuarioRow.cpf as string | null) ?? null,
    cep: (usuarioRow.cep as string | null) ?? null,
    logradouro: (usuarioRow.logradouro as string | null) ?? null,
    numero: (usuarioRow.numero as string | null) ?? null,
    complemento: (usuarioRow.complemento as string | null) ?? null,
    bairro: (usuarioRow.bairro as string | null) ?? null,
    cidade: (usuarioRow.cidade as string | null) ?? null,
    estado: (usuarioRow.estado as string | null) ?? null,
    ativo: Boolean(usuarioRow.ativo),
    created_at: toIso(usuarioRow.created_at as Date | string) ?? '',
    ultimo_acesso: toIso(usuarioRow.ultimo_acesso as Date | string | null),
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
      status: String(row.status),
      total: Number(row.total),
      frete: Number(row.frete ?? 0),
      created_at: toIso(row.created_at as Date | string) ?? '',
      qtd_itens: Number(row.qtd_itens),
      itens,
    };
  });

  const agendamentos = agendamentosRes.rows.map((row) => ({
    id: row.id as number,
    pedido_id: row.pedido_id as number,
    data_evento:
      row.data_evento instanceof Date
        ? row.data_evento.toISOString().slice(0, 10)
        : String(row.data_evento).slice(0, 10),
    status: String(row.status),
    pedido_total: Number(row.pedido_total),
    nome_entrega: (row.nome_entrega as string | null) ?? null,
    pedido_status: String(row.pedido_status),
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
