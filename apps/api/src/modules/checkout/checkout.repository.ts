import type pg from 'pg';

export async function findProductStock(
  db: pg.Pool,
  produtoId: number,
): Promise<number | null | undefined> {
  const prod = await db.query('SELECT estoque FROM produtos WHERE id = $1', [produtoId]);
  return prod.rows[0]?.estoque as number | null | undefined;
}

export async function insertPedido(
  db: pg.Pool,
  params: {
    usuarioId: number;
    nome_entrega: string;
    email_entrega: string;
    telefone_entrega: string | null;
    cpf_entrega: string | null;
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string | null;
    bairro: string | null;
    cidade: string;
    estado: string;
    subtotal: number;
    frete: number;
    freteServico: string;
    total: number;
    metodo_pagamento: string;
  },
): Promise<number> {
  const pedidoRes = await db.query<{ id: number }>(
    `INSERT INTO pedidos
       (usuario_id, nome_entrega, email_entrega, telefone_entrega, cpf_entrega,
        cep, logradouro, numero, complemento, bairro, cidade, estado,
        subtotal, frete, frete_servico, total, status, metodo_pagamento)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'aguardando_pagamento',$17)
     RETURNING id`,
    [
      params.usuarioId,
      params.nome_entrega,
      params.email_entrega,
      params.telefone_entrega,
      params.cpf_entrega,
      params.cep,
      params.logradouro,
      params.numero,
      params.complemento,
      params.bairro,
      params.cidade,
      params.estado,
      params.subtotal,
      params.frete,
      params.freteServico,
      params.total,
      params.metodo_pagamento,
    ],
  );
  return pedidoRes.rows[0]!.id;
}

export async function insertPedidoItem(
  db: pg.Pool,
  pedidoId: number,
  produtoId: number,
  nome: string,
  quantidade: number,
  precoUnitario: number,
  subtotal: number,
): Promise<void> {
  await db.query(
    `INSERT INTO pedido_itens (pedido_id, produto_id, nome_produto, quantidade, preco_unitario, subtotal)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [pedidoId, produtoId, nome, quantidade, precoUnitario, subtotal],
  );
}

export async function insertAgendamento(
  db: pg.Pool,
  pedidoId: number,
  dataEvento: string,
): Promise<void> {
  await db.query('INSERT INTO agendamentos (pedido_id, data_evento) VALUES ($1, $2)', [
    pedidoId,
    dataEvento,
  ]);
  await db.query('UPDATE pedidos SET data_evento = $1 WHERE id = $2', [dataEvento, pedidoId]);
}

export async function decrementProductStock(
  db: pg.Pool,
  produtoId: number,
  quantidade: number,
): Promise<void> {
  await db.query(
    'UPDATE produtos SET estoque = GREATEST(0, estoque - $1), updated_at = NOW() WHERE id = $2 AND estoque IS NOT NULL',
    [quantidade, produtoId],
  );
}

export async function insertMovimentacaoEstoque(
  db: pg.Pool,
  produtoId: number,
  quantidade: number,
  pedidoId: number,
): Promise<void> {
  await db
    .query(
      'INSERT INTO movimentacoes_estoque (produto_id, tipo, quantidade, origem, origem_id) VALUES ($1, $2, $3, $4, $5)',
      [produtoId, 'saida', quantidade, 'pedido', pedidoId],
    )
    .catch(() => {});
}

export async function insertPagamento(
  db: pg.Pool,
  params: {
    pedidoId: number;
    mpPaymentId: string;
    status: string;
    statusMp: string;
    valor: number;
    metodo: string;
    respostaJson: string;
  },
): Promise<void> {
  await db.query(
    `INSERT INTO pagamentos (pedido_id, mp_payment_id, status, status_mp, valor, metodo, resposta_json)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      params.pedidoId,
      params.mpPaymentId,
      params.status,
      params.statusMp,
      params.valor,
      params.metodo,
      params.respostaJson,
    ],
  );
}

export async function updatePedidoStatusAndPayment(
  db: pg.Pool,
  pedidoId: number,
  status: string,
  mpPaymentId: string,
): Promise<void> {
  await db.query('UPDATE pedidos SET status = $1, mp_payment_id = $2 WHERE id = $3', [
    status,
    mpPaymentId,
    pedidoId,
  ]);
}

export async function deleteCartItemsByUser(db: pg.Pool, usuarioId: number): Promise<void> {
  await db.query('DELETE FROM carrinho_itens WHERE usuario_id = $1', [usuarioId]);
}

export async function findPedidoById(db: pg.Pool, pedidoId: number): Promise<Record<string, unknown> | null> {
  const pedidoRes = await db.query('SELECT * FROM pedidos WHERE id = $1', [pedidoId]);
  return (pedidoRes.rows[0] as Record<string, unknown> | undefined) ?? null;
}

export async function findPedidoByIdAndUser(
  db: pg.Pool,
  pedidoId: number,
  usuarioId: number,
): Promise<Record<string, unknown> | null> {
  const pedidoRes = await db.query(
    `SELECT p.* FROM pedidos p WHERE p.id = $1 AND p.usuario_id = $2`,
    [pedidoId, usuarioId],
  );
  return (pedidoRes.rows[0] as Record<string, unknown> | undefined) ?? null;
}

export async function findPedidoItens(db: pg.Pool, pedidoId: number): Promise<Array<Record<string, unknown>>> {
  const itensRes = await db.query('SELECT * FROM pedido_itens WHERE pedido_id = $1', [pedidoId]);
  return itensRes.rows as Array<Record<string, unknown>>;
}

export async function findLatestPagamento(
  db: pg.Pool,
  pedidoId: number,
): Promise<Record<string, unknown> | undefined> {
  const pagamentoRes = await db.query(
    'SELECT * FROM pagamentos WHERE pedido_id = $1 ORDER BY id DESC LIMIT 1',
    [pedidoId],
  );
  return pagamentoRes.rows[0] as Record<string, unknown> | undefined;
}
