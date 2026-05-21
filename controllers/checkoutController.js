const mp = require('../services/mercadoPagoService');
const sumup = require('../services/sumupService');

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getItensCarrinho(db, usuarioId) {
  const r = await db.query(`
    SELECT
      ci.id, ci.quantidade, ci.preco_unitario,
      ci.preco_unitario * ci.quantidade AS subtotal,
      p.id AS produto_id, p.nome, p.subtitulo,
      (SELECT url FROM produtos_imagens WHERE produto_id = p.id ORDER BY id LIMIT 1) AS imagem
    FROM carrinho_itens ci
    JOIN produtos p ON p.id = ci.produto_id
    WHERE ci.usuario_id = $1
    ORDER BY ci.created_at ASC
  `, [usuarioId]);
  return r.rows;
}

async function getUsuario(db, id) {
  const r = await db.query('SELECT * FROM usuarios WHERE id = $1', [id]);
  return r.rows[0];
}

// ── GET /checkout ─────────────────────────────────────────────────────────────

exports.exibirCheckout = async (req, res) => {
  try {
    const usuario = await getUsuario(req.db, req.session.usuarioId);
    const itens = await getItensCarrinho(req.db, req.session.usuarioId);

    if (itens.length === 0) {
      return res.redirect('/carrinho');
    }

    const subtotal = itens.reduce((s, i) => s + parseFloat(i.subtotal), 0);

    res.render('pages/checkout', {
      usuario,
      itens,
      subtotal,
      mpPublicKey: process.env.MP_PUBLIC_KEY
    });
  } catch (err) {
    console.error('Erro no checkout:', err);
    res.redirect('/carrinho');
  }
};

// ── POST /checkout ────────────────────────────────────────────────────────────

exports.processarCheckout = async (req, res) => {
  const usuarioId = req.session.usuarioId;
  const db = req.db;
  const {
    nome_entrega, email_entrega, telefone_entrega, cpf_entrega,
    cep, logradouro, numero, complemento, bairro, cidade, estado,
    metodo_pagamento,
    mp_token, mp_installments, mp_payment_method_id
  } = req.body;

  await db.query('BEGIN');

  try {
    const itens = await getItensCarrinho(db, usuarioId);
    if (itens.length === 0) {
      await db.query('ROLLBACK');
      return res.redirect('/carrinho');
    }

    const subtotal = itens.reduce((s, i) => s + parseFloat(i.subtotal), 0);
    const frete = 0;
    const total = subtotal + frete;

    const pedidoRes = await db.query(`
      INSERT INTO pedidos
        (usuario_id, nome_entrega, email_entrega, telefone_entrega, cpf_entrega,
         cep, logradouro, numero, complemento, bairro, cidade, estado,
         subtotal, frete, total, status, metodo_pagamento)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'aguardando_pagamento',$16)
      RETURNING id
    `, [
      usuarioId, nome_entrega, email_entrega, telefone_entrega, cpf_entrega,
      cep, logradouro, numero, complemento, bairro, cidade, estado,
      subtotal, frete, total, metodo_pagamento
    ]);

    const pedidoId = pedidoRes.rows[0].id;

    for (const item of itens) {
      await db.query(`
        INSERT INTO pedido_itens (pedido_id, produto_id, nome_produto, quantidade, preco_unitario, subtotal)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [pedidoId, item.produto_id, item.nome, item.quantidade, item.preco_unitario, item.subtotal]);
    }

    // Debitar estoque dos produtos (se controle ativo)
    const cfgEstoqueRes = await db.query(
      "SELECT valor FROM configuracoes WHERE chave = 'controla_estoque'"
    ).catch(() => ({ rows: [] }));
    if (cfgEstoqueRes.rows[0]?.valor === 'true') {
      for (const item of itens) {
        await db.query(
          'UPDATE produtos SET estoque = GREATEST(0, estoque - $1), updated_at = NOW() WHERE id = $2 AND estoque IS NOT NULL',
          [item.quantidade, item.produto_id]
        );
        await db.query(
          'INSERT INTO movimentacoes_estoque (produto_id, tipo, quantidade, origem, origem_id) VALUES ($1, $2, $3, $4, $5)',
          [item.produto_id, 'saida', item.quantidade, 'pedido', pedidoId]
        );
      }
    }

    let mpResult;
    const dadosPagador = {
      pedidoId,
      valor: total,
      email: email_entrega,
      nome: nome_entrega,
      cpf: cpf_entrega,
      descricao: `Pedido #${pedidoId} (${itens.length} item${itens.length > 1 ? 's' : ''})`
    };

    if (metodo_pagamento === 'pix') {
      mpResult = await mp.criarPagamentoPix(dadosPagador);
    } else if (metodo_pagamento === 'boleto') {
      mpResult = await mp.criarBoleto({ ...dadosPagador, cep, logradouro, numero, bairro, cidade, estado });
    } else if (metodo_pagamento === 'cartao') {
      mpResult = await mp.criarPagamentoCartao({
        ...dadosPagador,
        token: mp_token,
        parcelas: parseInt(mp_installments) || 1,
        metodoPagamento: mp_payment_method_id
      });

    } else if (metodo_pagamento === 'sumup_online') {
      const checkoutSumup = await sumup.criarCheckoutOnline({
        pedidoId,
        valor: total,
        descricao: dadosPagador.descricao,
        email: email_entrega,
        redirectUrl: `${process.env.APP_URL}/checkout/resultado/${pedidoId}`
      });

      await db.query(`
        INSERT INTO pagamentos (pedido_id, mp_payment_id, status, status_mp, valor, metodo, resposta_json)
        VALUES ($1, $2, 'pendente', 'PENDING', $3, 'sumup_online', $4)
      `, [pedidoId, checkoutSumup.id, total, JSON.stringify(checkoutSumup)]);

      await db.query(
        "UPDATE pedidos SET status = 'aguardando_pagamento', mp_payment_id = $1 WHERE id = $2",
        [checkoutSumup.id, pedidoId]
      );

      await db.query('DELETE FROM carrinho_itens WHERE usuario_id = $1', [usuarioId]);
      await db.query('COMMIT');

      return res.redirect(checkoutSumup.hosted_checkout_url || checkoutSumup.checkout_url || `/checkout/resultado/${pedidoId}`);

    } else {
      await db.query('ROLLBACK');
      return res.redirect('/checkout?erro=metodo_invalido');
    }

    const statusInterno = mp.mapearStatus(mpResult.status);

    await db.query(`
      INSERT INTO pagamentos
        (pedido_id, mp_payment_id, status, status_mp, valor, metodo, resposta_json)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [pedidoId, String(mpResult.id), statusInterno, mpResult.status, total, metodo_pagamento, JSON.stringify(mpResult)]);

    await db.query(
      "UPDATE pedidos SET status = $1, mp_payment_id = $2 WHERE id = $3",
      [statusInterno === 'pago' ? 'pago' : 'aguardando_pagamento', String(mpResult.id), pedidoId]
    );

    await db.query('DELETE FROM carrinho_itens WHERE usuario_id = $1', [usuarioId]);
    await db.query('COMMIT');

    res.redirect(`/checkout/resultado/${pedidoId}`);

  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Erro ao processar checkout:', err);
    res.redirect('/checkout?erro=pagamento');
  }
};

// ── GET /checkout/resultado/:id ───────────────────────────────────────────────

exports.exibirResultado = async (req, res) => {
  try {
    const pedidoRes = await req.db.query(`
      SELECT p.*, u.nome AS usuario_nome
      FROM pedidos p
      JOIN usuarios u ON u.id = p.usuario_id
      WHERE p.id = $1 AND p.usuario_id = $2
    `, [req.params.id, req.session.usuarioId]);

    if (!pedidoRes.rows[0]) return res.redirect('/');

    const pedido = pedidoRes.rows[0];
    const itensRes = await req.db.query('SELECT * FROM pedido_itens WHERE pedido_id = $1', [pedido.id]);
    const pagamentoRes = await req.db.query('SELECT * FROM pagamentos WHERE pedido_id = $1 ORDER BY id DESC LIMIT 1', [pedido.id]);

    const pagamento = pagamentoRes.rows[0];
    let pixInfo = null;
    let boletoUrl = null;

    if (pagamento) {
      const resp = JSON.parse(pagamento.resposta_json || '{}');
      if (pedido.metodo_pagamento === 'pix') {
        pixInfo = {
          qr_code: resp.point_of_interaction?.transaction_data?.qr_code,
          qr_code_base64: resp.point_of_interaction?.transaction_data?.qr_code_base64,
          expiracao: resp.date_of_expiration
        };
      } else if (pedido.metodo_pagamento === 'boleto') {
        boletoUrl = resp.transaction_details?.external_resource_url;
      }
    }

    res.render('pages/checkout-resultado', { pedido, itens: itensRes.rows, pagamento, pixInfo, boletoUrl });
  } catch (err) {
    console.error('Erro ao exibir resultado:', err);
    res.redirect('/');
  }
};

// ── GET /meus-pedidos ─────────────────────────────────────────────────────────

exports.meusPedidos = async (req, res) => {
  try {
    const r = await req.db.query(`
      SELECT p.*, COUNT(pi.id) AS total_itens
      FROM pedidos p
      LEFT JOIN pedido_itens pi ON pi.pedido_id = p.id
      WHERE p.usuario_id = $1
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `, [req.session.usuarioId]);

    res.render('pages/meus-pedidos', { pedidos: r.rows });
  } catch (err) {
    console.error('Erro em meus pedidos:', err);
    res.render('pages/meus-pedidos', { pedidos: [] });
  }
};

// ── POST /webhook/mercadopago ─────────────────────────────────────────────────

exports.webhook = async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === 'payment' && data?.id) {
      const mpData = await mp.consultarPagamento(data.id);
      const statusInterno = mp.mapearStatus(mpData.status);
      const pedidoId = mpData.external_reference;

      if (pedidoId) {
        await req.db.query(
          'UPDATE pagamentos SET status = $1, status_mp = $2 WHERE mp_payment_id = $3',
          [statusInterno, mpData.status, String(data.id)]
        );

        const novoStatus = statusInterno === 'pago' ? 'pago'
          : statusInterno === 'rejeitado' ? 'cancelado'
          : 'aguardando_pagamento';

        await req.db.query('UPDATE pedidos SET status = $1 WHERE id = $2', [novoStatus, pedidoId]);
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Erro no webhook MP:', err);
    res.sendStatus(200);
  }
};

// ── Admin: listar pedidos ─────────────────────────────────────────────────────

exports.adminPedidos = async (req, res) => {
  try {
    const r = await req.db.query(`
      SELECT p.*, u.nome AS usuario_nome, u.email AS usuario_email,
             COUNT(pi.id) AS total_itens
      FROM pedidos p
      JOIN usuarios u ON u.id = p.usuario_id
      LEFT JOIN pedido_itens pi ON pi.pedido_id = p.id
      GROUP BY p.id, u.nome, u.email
      ORDER BY p.created_at DESC
      LIMIT 100
    `);
    res.render('pages/admin-pedidos', { pedidos: r.rows });
  } catch (err) {
    console.error('Erro ao listar pedidos admin:', err);
    res.render('pages/admin-pedidos', { pedidos: [] });
  }
};

exports.adminDetalhePedido = async (req, res) => {
  try {
    const pedidoRes = await req.db.query(`
      SELECT p.*, u.nome AS usuario_nome, u.email AS usuario_email
      FROM pedidos p
      JOIN usuarios u ON u.id = p.usuario_id
      WHERE p.id = $1
    `, [req.params.id]);

    if (!pedidoRes.rows[0]) return res.redirect('/admin/pedidos');

    const pedido = pedidoRes.rows[0];
    const itens = (await req.db.query('SELECT * FROM pedido_itens WHERE pedido_id = $1', [pedido.id])).rows;
    const pagamento = (await req.db.query('SELECT * FROM pagamentos WHERE pedido_id = $1 ORDER BY id DESC LIMIT 1', [pedido.id])).rows[0];

    res.render('pages/admin-pedido-detalhe', { pedido, itens, pagamento });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/pedidos');
  }
};

exports.adminAtualizarStatus = async (req, res) => {
  const { status } = req.body;
  const statusValidos = ['aguardando_pagamento', 'pago', 'em_separacao', 'enviado', 'entregue', 'cancelado'];
  if (!statusValidos.includes(status)) return res.redirect('/admin/pedidos');

  await req.db.query('UPDATE pedidos SET status = $1, updated_at = NOW() WHERE id = $2', [status, req.params.id]);
  res.redirect(`/admin/pedidos/${req.params.id}`);
};

// ── SumUp: webhook ────────────────────────────────────────────────────────────

exports.webhookSumup = async (req, res) => {
  try {
    const evento = req.body;
    if (evento.event_type === 'CHECKOUT_STATUS_CHANGED' || evento.type === 'payment') {
      const checkoutId = evento.id || evento.checkout_id;
      if (checkoutId) {
        const checkout = await sumup.consultarCheckout(checkoutId);
        const statusInterno = sumup.mapearStatus(checkout.status);

        await req.db.query(
          'UPDATE pagamentos SET status = $1, status_mp = $2 WHERE mp_payment_id = $3',
          [statusInterno, checkout.status, checkoutId]
        );

        const pedidoRes = await req.db.query(
          "SELECT pedido_id FROM pagamentos WHERE mp_payment_id = $1",
          [checkoutId]
        );
        if (pedidoRes.rows[0]) {
          const novoStatus = statusInterno === 'pago' ? 'pago'
            : statusInterno === 'rejeitado' ? 'cancelado'
            : 'aguardando_pagamento';
          await req.db.query('UPDATE pedidos SET status = $1 WHERE id = $2', [novoStatus, pedidoRes.rows[0].pedido_id]);
        }
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('Erro no webhook SumUp:', err);
    res.sendStatus(200);
  }
};
