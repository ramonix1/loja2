const stripeService = require('../services/stripeService');
const sumup = require('../services/sumupService');
const { getConfigs } = require('./configController');
const { getAgendaConfig, getDisponibilidade } = require('./agendaController');
const { enviarNotificacaoPedidoPago, enviarEmailRastreio } = require('../services/emailService');
const { validateCheckoutData } = require('../middlewares/validation');
const BillingService = require('../services/billingService');

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getLojaInfo(db) {
  const r = await db.query("SELECT chave, valor FROM configuracoes WHERE chave IN ('loja_nome','loja_email')").catch(() => ({ rows: [] }));
  const cfg = {};
  r.rows.forEach(row => { cfg[row.chave] = row.valor; });
  return { nome: cfg.loja_nome || 'Lojão', email: cfg.loja_email || '' };
}

async function notificarPedidoPago(db, pedidoId, itens) {
  try {
    const loja = await getLojaInfo(db);
    if (!loja.email) return;
    const pedidoRes = await db.query('SELECT * FROM pedidos WHERE id = $1', [pedidoId]);
    if (!pedidoRes.rows[0]) return;
    await enviarNotificacaoPedidoPago({ lojaNome: loja.nome, lojaEmail: loja.email, pedido: pedidoRes.rows[0], itens });
  } catch (err) {
    console.error('[Email] Falha ao notificar pedido pago:', err.message);
  }
}

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
    const configs = await getConfigs(req.db);
    const moduloAgenda = configs.modulo_agenda === 'true';
    const agendaConfig = moduloAgenda ? await getAgendaConfig(req.db) : null;
    const sumupHabilitado = configs.habilitar_sumup === 'true';

    res.render('pages/checkout', {
      usuario,
      itens,
      subtotal,
      stripePublicKey: process.env.STRIPE_PUBLIC_KEY || '',
      moduloAgenda,
      agendaConfig,
      sumupHabilitado,
      erro: req.query.erro || null,
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
    metodo_pagamento, data_evento,
    stripe_payment_method_id, frete_valor, frete_servico
  } = req.body;

  // Validar todos os dados de entrada
  const errosValidacao = validateCheckoutData(req.body);
  if (errosValidacao.length > 0) {
    await db.query('ROLLBACK').catch(() => {});
    console.warn('Validação de checkout falhou:', errosValidacao);
    return res.redirect(`/checkout?erro=dados_invalidos`);
  }

  // Validar frete
  const freteNum = frete_valor ? parseFloat(frete_valor) : NaN;
  if (isNaN(freteNum) || freteNum < 0) {
    await db.query('ROLLBACK').catch(() => {});
    return res.redirect('/checkout?erro=frete_invalido');
  }

  console.log(`[Checkout] POST recebido — método: ${metodo_pagamento}, usuário: ${usuarioId}`);

  // Verificar agenda antes de iniciar transação
  const cfgsAgenda = await getConfigs(db);
  const moduloAgenda = cfgsAgenda.modulo_agenda === 'true';
  if (moduloAgenda) {
    if (!data_evento || !/^\d{4}-\d{2}-\d{2}$/.test(data_evento)) {
      return res.redirect('/checkout?erro=data_evento_obrigatoria');
    }
    const disp = await getDisponibilidade(db, data_evento);
    if (!disp.disponivel) {
      return res.redirect('/checkout?erro=data_indisponivel');
    }
  }

  await db.query('BEGIN');

  try {
    const itens = await getItensCarrinho(db, usuarioId);
    if (itens.length === 0) {
      await db.query('ROLLBACK');
      return res.redirect('/carrinho');
    }

    const subtotal = itens.reduce((s, i) => s + parseFloat(i.subtotal), 0);
    const frete = Math.max(0, freteNum);
    const frete_servico_limpo = (frete_servico || '').slice(0, 100);
    const total = subtotal + frete;

    const pedidoRes = await db.query(`
      INSERT INTO pedidos
        (usuario_id, nome_entrega, email_entrega, telefone_entrega, cpf_entrega,
         cep, logradouro, numero, complemento, bairro, cidade, estado,
         subtotal, frete, frete_servico, total, status, metodo_pagamento)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'aguardando_pagamento',$17)
      RETURNING id
    `, [
      usuarioId, nome_entrega, email_entrega, telefone_entrega, cpf_entrega,
      cep, logradouro, numero, complemento, bairro, cidade, estado,
      subtotal, frete, frete_servico_limpo, total, metodo_pagamento
    ]);

    const pedidoId = pedidoRes.rows[0].id;

    for (const item of itens) {
      await db.query(`
        INSERT INTO pedido_itens (pedido_id, produto_id, nome_produto, quantidade, preco_unitario, subtotal)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [pedidoId, item.produto_id, item.nome, item.quantidade, item.preco_unitario, item.subtotal]);
    }

    // Registrar agendamento (se módulo ativo)
    if (moduloAgenda && data_evento) {
      await db.query(
        'INSERT INTO agendamentos (pedido_id, data_evento) VALUES ($1, $2)',
        [pedidoId, data_evento]
      );
      await db.query('UPDATE pedidos SET data_evento = $1 WHERE id = $2', [data_evento, pedidoId]);
    }

    // Debitar estoque dos produtos (se controle ativo)
    let cfgEstoqueRes;
    try {
      cfgEstoqueRes = await db.query(
        "SELECT valor FROM configuracoes WHERE chave = 'controla_estoque'"
      );
    } catch (err) {
      console.warn('⚠️ Erro ao verificar controle de estoque:', err.message);
      cfgEstoqueRes = { rows: [] };
    }
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

    let stripeResult;
    const dadosPagador = {
      pedidoId,
      valor: total,
      email: email_entrega,
      nome: nome_entrega,
      cpf: cpf_entrega,
      descricao: `Pedido #${pedidoId} (${itens.length} item${itens.length > 1 ? 's' : ''})`
    };

    if (metodo_pagamento === 'pix') {
      stripeResult = await stripeService.criarPagamentoPix(dadosPagador);
    } else if (metodo_pagamento === 'boleto') {
      stripeResult = await stripeService.criarBoleto({
        ...dadosPagador, cep, logradouro, numero, bairro, cidade, estado
      });
    } else if (metodo_pagamento === 'cartao') {
      if (!stripe_payment_method_id) {
        await db.query('ROLLBACK');
        return res.redirect('/checkout?erro=metodo_invalido');
      }
      stripeResult = await stripeService.criarPagamentoCartao({
        ...dadosPagador,
        paymentMethodId: stripe_payment_method_id
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

    } else if (metodo_pagamento === 'teste' && process.env.NODE_ENV !== 'production') {
      await db.query(`
        INSERT INTO pagamentos (pedido_id, mp_payment_id, status, status_mp, valor, metodo, resposta_json)
        VALUES ($1, $2, 'pago', 'approved', $3, 'teste', $4)
      `, [pedidoId, `TESTE-${pedidoId}`, total, JSON.stringify({ test: true })]);

      await db.query(
        "UPDATE pedidos SET status = 'pago', mp_payment_id = $1 WHERE id = $2",
        [`TESTE-${pedidoId}`, pedidoId]
      );

      await db.query('DELETE FROM carrinho_itens WHERE usuario_id = $1', [usuarioId]);
      await db.query('COMMIT');
      notificarPedidoPago(db, pedidoId, itens);
      return res.redirect(`/checkout/resultado/${pedidoId}`);

    } else {
      await db.query('ROLLBACK');
      return res.redirect('/checkout?erro=metodo_invalido');
    }

    const statusInterno = stripeService.mapearStatus(stripeResult.status);

    await db.query(`
      INSERT INTO pagamentos
        (pedido_id, mp_payment_id, status, status_mp, valor, metodo, resposta_json)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [pedidoId, stripeResult.id, statusInterno, stripeResult.status, total, metodo_pagamento, JSON.stringify(stripeResult)]);

    await db.query(
      "UPDATE pedidos SET status = $1, mp_payment_id = $2 WHERE id = $3",
      [statusInterno === 'pago' ? 'pago' : 'aguardando_pagamento', stripeResult.id, pedidoId]
    );

    // Cartão com 3DS: redireciona para página de autenticação do Stripe
    if (metodo_pagamento === 'cartao' && stripeResult.status === 'requires_action' &&
        stripeResult.next_action?.type === 'redirect_to_url') {
      await db.query('DELETE FROM carrinho_itens WHERE usuario_id = $1', [usuarioId]);
      await db.query('COMMIT');
      return res.redirect(stripeResult.next_action.redirect_to_url.url);
    }

    await db.query('DELETE FROM carrinho_itens WHERE usuario_id = $1', [usuarioId]);
    await db.query('COMMIT');

    if (statusInterno === 'pago') notificarPedidoPago(db, pedidoId, itens);

    res.redirect(`/checkout/resultado/${pedidoId}`);

  } catch (err) {
    try {
      await db.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error('⚠️ Erro ao fazer ROLLBACK:', rollbackErr.message);
    }
    console.error('\n━━━ ERRO NO CHECKOUT ━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Mensagem:', err.message);
    if (err.cause) console.error('Causa:', err.cause);
    if (err.statusCode) console.error('HTTP Status:', err.statusCode);
    if (err.body) console.error('Resposta API:', JSON.stringify(err.body, null, 2));
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
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
        const pix = resp.next_action?.pix_display_qr_code;
        pixInfo = {
          qr_code: pix?.data,
          qr_code_url: pix?.image_url_png,
          expiracao: pix?.expires_at ? new Date(pix.expires_at * 1000) : null,
        };
      } else if (pedido.metodo_pagamento === 'boleto') {
        boletoUrl = resp.next_action?.boleto_display_details?.hosted_voucher_url;
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

// ── POST /webhook/stripe ──────────────────────────────────────────────────────

exports.webhookStripe = async (req, res) => {
  try {
    const event = req.body;

    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data?.object;
      if (pi?.id) {
        await req.db.query(
          "UPDATE pagamentos SET status = 'pago', status_mp = $1 WHERE mp_payment_id = $2",
          [pi.status, pi.id]
        );
        const r = await req.db.query(
          "SELECT pedido_id FROM pagamentos WHERE mp_payment_id = $1 LIMIT 1", [pi.id]
        );
        if (r.rows[0]) {
          await req.db.query("UPDATE pedidos SET status = 'pago' WHERE id = $1", [r.rows[0].pedido_id]);
        }
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data?.object;
      if (pi?.id) {
        await req.db.query(
          "UPDATE pagamentos SET status = 'rejeitado', status_mp = $1 WHERE mp_payment_id = $2",
          [pi.status, pi.id]
        );
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Erro no webhook Stripe:', err);
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
    res.render('pages/admin-pedidos', { pedidos: r.rows, activePage: 'pedidos' });
  } catch (err) {
    console.error('Erro ao listar pedidos admin:', err);
    res.render('pages/admin-pedidos', { pedidos: [], activePage: 'pedidos' });
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
  const { status, codigo_rastreio } = req.body;
  const pedidoId = req.params.id;
  const statusValidos = ['aguardando_pagamento', 'pago', 'em_separacao', 'enviado', 'entregue', 'cancelado'];
  if (!statusValidos.includes(status)) return res.redirect('/admin/pedidos');

  const rastreio = codigo_rastreio?.trim() || null;

  await req.db.query(
    'UPDATE pedidos SET status = $1, codigo_rastreio = COALESCE($2, codigo_rastreio), updated_at = NOW() WHERE id = $3',
    [status, rastreio, pedidoId]
  );

  if (status === 'enviado' && rastreio) {
    try {
      const loja = await getLojaInfo(req.db);
      const pedidoRes = await req.db.query('SELECT * FROM pedidos WHERE id = $1', [pedidoId]);
      if (pedidoRes.rows[0]) {
        await enviarEmailRastreio({ lojaNome: loja.nome, lojaEmail: loja.email, pedido: pedidoRes.rows[0], codigoRastreio: rastreio });
      }
    } catch (err) {
      console.error('[Email] Falha ao enviar rastreio:', err.message);
    }
  }

  res.redirect(`/admin/pedidos/${pedidoId}`);
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
