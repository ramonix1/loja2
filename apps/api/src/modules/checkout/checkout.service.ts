import type pg from 'pg';

import { getConfigs, getLojaInfo } from '../../lib/config.js';
import { validateCheckoutData } from '../../lib/validation.js';
import { getAgendaConfig, getDisponibilidade } from '../agenda/agenda.service.js';
import { getCartItems } from '../cart/cart.service.js';
import { recordCommissionOnOrder } from '../../services/billing.service.js';
import { enviarNotificacaoPedidoPago } from '../../services/email.service.js';
import * as stripeService from '../../services/stripe.service.js';
import * as sumupService from '../../services/sumup.service.js';

export interface CheckoutInput {
  nome_entrega: string;
  email_entrega: string;
  telefone_entrega?: string;
  cpf_entrega?: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro?: string;
  cidade: string;
  estado: string;
  metodo_pagamento: string;
  data_evento?: string;
  stripe_payment_method_id?: string;
  frete_valor?: number;
  frete_servico?: string;
}

export type CheckoutResult =
  | {
      ok: true;
      pedido_id: number;
      status: string;
      redirect_url?: string;
    }
  | { ok: false; error: string; code: string; status: number };

async function notificarPedidoPago(db: pg.Pool, pedidoId: number, itens: Awaited<ReturnType<typeof getCartItems>>) {
  try {
    const loja = await getLojaInfo(db);
    if (!loja.email) return;
    const pedidoRes = await db.query('SELECT * FROM pedidos WHERE id = $1', [pedidoId]);
    if (!pedidoRes.rows[0]) return;
    await enviarNotificacaoPedidoPago({
      lojaNome: loja.nome,
      lojaEmail: loja.email,
      pedido: pedidoRes.rows[0] as { id: number; total: number; metodo_pagamento?: string },
      itens: itens.map((i) => ({
        quantidade: i.quantidade,
        nome: i.nome,
        subtotal: i.subtotal,
      })),
    });
  } catch (err) {
    console.error('[Email] Falha ao notificar pedido pago:', err instanceof Error ? err.message : err);
  }
}

async function registrarComissao(tenantId: number | undefined, pedidoId: number, total: number) {
  if (!tenantId) return;
  try {
    await recordCommissionOnOrder(tenantId, pedidoId, total);
  } catch (err) {
    console.error('[Billing] Erro ao registrar comissão:', err instanceof Error ? err.message : err);
  }
}

export async function getCheckoutPreview(db: pg.Pool, usuarioId: number) {
  const itens = await getCartItems(db, usuarioId);
  const subtotal = itens.reduce((s, i) => s + i.subtotal, 0);
  const configs = await getConfigs(db);
  const moduloAgenda = configs.modulo_agenda === 'true';
  const agendaConfig = moduloAgenda ? await getAgendaConfig(db) : null;
  const sumupHabilitado = configs.habilitar_sumup === 'true';

  return {
    itens,
    subtotal,
    modulo_agenda: moduloAgenda,
    agenda_config: agendaConfig,
    sumup_habilitado: sumupHabilitado,
    stripe_public_key: process.env.STRIPE_PUBLIC_KEY ?? '',
  };
}

export async function processCheckout(
  db: pg.Pool,
  usuarioId: number,
  tenantId: number | undefined,
  input: CheckoutInput,
): Promise<CheckoutResult> {
  const erros = validateCheckoutData(input);
  if (erros.length > 0) {
    return { ok: false, error: erros.join('; '), code: 'VALIDATION_ERROR', status: 400 };
  }

  const freteNum = input.frete_valor !== undefined ? parseFloat(String(input.frete_valor)) : 0;
  if (Number.isNaN(freteNum) || freteNum < 0) {
    return { ok: false, error: 'Frete inválido.', code: 'INVALID_SHIPPING', status: 400 };
  }

  const configs = await getConfigs(db);
  const moduloAgenda = configs.modulo_agenda === 'true';
  if (moduloAgenda) {
    if (!input.data_evento || !/^\d{4}-\d{2}-\d{2}$/.test(input.data_evento)) {
      return {
        ok: false,
        error: 'Data do evento obrigatória.',
        code: 'EVENT_DATE_REQUIRED',
        status: 400,
      };
    }
    const disp = await getDisponibilidade(db, input.data_evento);
    if (!disp.disponivel) {
      return {
        ok: false,
        error: 'Data indisponível.',
        code: 'EVENT_DATE_UNAVAILABLE',
        status: 400,
      };
    }
  }

  await db.query('BEGIN');

  try {
    const itens = await getCartItems(db, usuarioId);
    if (itens.length === 0) {
      await db.query('ROLLBACK');
      return { ok: false, error: 'Carrinho vazio.', code: 'EMPTY_CART', status: 400 };
    }

    // Verificar estoque antes de criar pedido
    if (configs.controla_estoque === 'true') {
      for (const item of itens) {
        const prod = await db.query('SELECT estoque FROM produtos WHERE id = $1', [item.produto_id]);
        const estoque = prod.rows[0]?.estoque as number | null;
        if (estoque !== null && item.quantidade > estoque) {
          await db.query('ROLLBACK');
          return {
            ok: false,
            error: `Estoque insuficiente para ${item.nome}.`,
            code: 'INSUFFICIENT_STOCK',
            status: 409,
          };
        }
      }
    }

    const subtotal = itens.reduce((s, i) => s + i.subtotal, 0);
    const frete = Math.max(0, freteNum);
    const freteServico = (input.frete_servico || '').slice(0, 100);
    const total = subtotal + frete;

    const pedidoRes = await db.query<{ id: number }>(
      `INSERT INTO pedidos
         (usuario_id, nome_entrega, email_entrega, telefone_entrega, cpf_entrega,
          cep, logradouro, numero, complemento, bairro, cidade, estado,
          subtotal, frete, frete_servico, total, status, metodo_pagamento)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'aguardando_pagamento',$17)
       RETURNING id`,
      [
        usuarioId,
        input.nome_entrega,
        input.email_entrega,
        input.telefone_entrega ?? null,
        input.cpf_entrega ?? null,
        input.cep,
        input.logradouro,
        input.numero,
        input.complemento ?? null,
        input.bairro ?? null,
        input.cidade,
        input.estado,
        subtotal,
        frete,
        freteServico,
        total,
        input.metodo_pagamento,
      ],
    );

    const pedidoId = pedidoRes.rows[0]!.id;

    for (const item of itens) {
      await db.query(
        `INSERT INTO pedido_itens (pedido_id, produto_id, nome_produto, quantidade, preco_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [pedidoId, item.produto_id, item.nome, item.quantidade, item.preco_unitario, item.subtotal],
      );
    }

    if (moduloAgenda && input.data_evento) {
      await db.query('INSERT INTO agendamentos (pedido_id, data_evento) VALUES ($1, $2)', [
        pedidoId,
        input.data_evento,
      ]);
      await db.query('UPDATE pedidos SET data_evento = $1 WHERE id = $2', [
        input.data_evento,
        pedidoId,
      ]);
    }

    if (configs.controla_estoque === 'true') {
      for (const item of itens) {
        await db.query(
          'UPDATE produtos SET estoque = GREATEST(0, estoque - $1), updated_at = NOW() WHERE id = $2 AND estoque IS NOT NULL',
          [item.quantidade, item.produto_id],
        );
        await db.query(
          'INSERT INTO movimentacoes_estoque (produto_id, tipo, quantidade, origem, origem_id) VALUES ($1, $2, $3, $4, $5)',
          [item.produto_id, 'saida', item.quantidade, 'pedido', pedidoId],
        ).catch(() => {});
      }
    }

    const dadosPagador = {
      pedidoId,
      valor: total,
      email: input.email_entrega,
      nome: input.nome_entrega,
      cpf: input.cpf_entrega,
      descricao: `Pedido #${pedidoId} (${itens.length} item${itens.length > 1 ? 's' : ''})`,
    };

    if (input.metodo_pagamento === 'teste') {
      if (process.env.NODE_ENV === 'production') {
        await db.query('ROLLBACK');
        return { ok: false, error: 'Método inválido.', code: 'INVALID_PAYMENT', status: 400 };
      }

      await db.query(
        `INSERT INTO pagamentos (pedido_id, mp_payment_id, status, status_mp, valor, metodo, resposta_json)
         VALUES ($1, $2, 'pago', 'approved', $3, 'teste', $4)`,
        [pedidoId, `TESTE-${pedidoId}`, total, JSON.stringify({ test: true })],
      );
      await db.query("UPDATE pedidos SET status = 'pago', mp_payment_id = $1 WHERE id = $2", [
        `TESTE-${pedidoId}`,
        pedidoId,
      ]);
      await db.query('DELETE FROM carrinho_itens WHERE usuario_id = $1', [usuarioId]);
      await db.query('COMMIT');

      void notificarPedidoPago(db, pedidoId, itens);
      await registrarComissao(tenantId, pedidoId, total);

      return { ok: true, pedido_id: pedidoId, status: 'pago' };
    }

    if (input.metodo_pagamento === 'sumup_online') {
      const checkoutSumup = await sumupService.criarCheckoutOnline({
        pedidoId,
        valor: total,
        descricao: dadosPagador.descricao,
        email: input.email_entrega,
        redirectUrl: `${process.env.APP_URL ?? 'http://localhost:3000'}/checkout/resultado/${pedidoId}`,
      });

      await db.query(
        `INSERT INTO pagamentos (pedido_id, mp_payment_id, status, status_mp, valor, metodo, resposta_json)
         VALUES ($1, $2, 'pendente', 'PENDING', $3, 'sumup_online', $4)`,
        [pedidoId, checkoutSumup.id, total, JSON.stringify(checkoutSumup)],
      );
      await db.query(
        "UPDATE pedidos SET status = 'aguardando_pagamento', mp_payment_id = $1 WHERE id = $2",
        [checkoutSumup.id, pedidoId],
      );
      await db.query('DELETE FROM carrinho_itens WHERE usuario_id = $1', [usuarioId]);
      await db.query('COMMIT');

      return {
        ok: true,
        pedido_id: pedidoId,
        status: 'aguardando_pagamento',
        redirect_url:
          checkoutSumup.hosted_checkout_url ??
          checkoutSumup.checkout_url ??
          `/checkout/resultado/${pedidoId}`,
      };
    }

    let stripeResult: Awaited<ReturnType<typeof stripeService.criarPagamentoPix>>;

    if (input.metodo_pagamento === 'pix') {
      stripeResult = await stripeService.criarPagamentoPix(dadosPagador);
    } else if (input.metodo_pagamento === 'boleto') {
      stripeResult = await stripeService.criarBoleto({
        ...dadosPagador,
        cep: input.cep,
        logradouro: input.logradouro,
        numero: input.numero,
        bairro: input.bairro,
        cidade: input.cidade,
        estado: input.estado,
      });
    } else if (input.metodo_pagamento === 'cartao') {
      if (!input.stripe_payment_method_id) {
        await db.query('ROLLBACK');
        return { ok: false, error: 'Método inválido.', code: 'INVALID_PAYMENT', status: 400 };
      }
      stripeResult = await stripeService.criarPagamentoCartao({
        ...dadosPagador,
        paymentMethodId: input.stripe_payment_method_id,
      });
    } else {
      await db.query('ROLLBACK');
      return { ok: false, error: 'Método inválido.', code: 'INVALID_PAYMENT', status: 400 };
    }

    const statusInterno = stripeService.mapearStatus(stripeResult.status);

    await db.query(
      `INSERT INTO pagamentos (pedido_id, mp_payment_id, status, status_mp, valor, metodo, resposta_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        pedidoId,
        stripeResult.id,
        statusInterno,
        stripeResult.status,
        total,
        input.metodo_pagamento,
        JSON.stringify(stripeResult),
      ],
    );

    await db.query("UPDATE pedidos SET status = $1, mp_payment_id = $2 WHERE id = $3", [
      statusInterno === 'pago' ? 'pago' : 'aguardando_pagamento',
      stripeResult.id,
      pedidoId,
    ]);

    let redirectUrl: string | undefined;
    if (
      input.metodo_pagamento === 'cartao' &&
      stripeResult.status === 'requires_action' &&
      stripeResult.next_action?.type === 'redirect_to_url'
    ) {
      redirectUrl = stripeResult.next_action.redirect_to_url?.url ?? undefined;
    }

    await db.query('DELETE FROM carrinho_itens WHERE usuario_id = $1', [usuarioId]);
    await db.query('COMMIT');

    if (statusInterno === 'pago') {
      void notificarPedidoPago(db, pedidoId, itens);
      await registrarComissao(tenantId, pedidoId, total);
    }

    return {
      ok: true,
      pedido_id: pedidoId,
      status: statusInterno === 'pago' ? 'pago' : 'aguardando_pagamento',
      redirect_url: redirectUrl,
    };
  } catch (err) {
    await db.query('ROLLBACK').catch(() => {});
    console.error('[Checkout] Erro:', err);
    return {
      ok: false,
      error: 'Erro ao processar pagamento.',
      code: 'CHECKOUT_ERROR',
      status: 500,
    };
  }
}

export async function getCheckoutResult(db: pg.Pool, usuarioId: number, pedidoId: number) {
  const pedidoRes = await db.query(
    `SELECT p.* FROM pedidos p WHERE p.id = $1 AND p.usuario_id = $2`,
    [pedidoId, usuarioId],
  );
  if (!pedidoRes.rows[0]) return null;

  const itensRes = await db.query('SELECT * FROM pedido_itens WHERE pedido_id = $1', [pedidoId]);
  const pagamentoRes = await db.query(
    'SELECT * FROM pagamentos WHERE pedido_id = $1 ORDER BY id DESC LIMIT 1',
    [pedidoId],
  );

  const pedido = pedidoRes.rows[0] as Record<string, unknown>;
  const pagamento = pagamentoRes.rows[0] as Record<string, unknown> | undefined;
  let pixInfo: Record<string, unknown> | null = null;
  let boletoUrl: string | null = null;

  if (pagamento) {
    const resp = JSON.parse(String(pagamento.resposta_json || '{}')) as {
      next_action?: {
        pix_display_qr_code?: { data?: string; image_url_png?: string; expires_at?: number };
        boleto_display_details?: { hosted_voucher_url?: string };
        redirect_to_url?: { url?: string };
      };
    };
    if (pedido.metodo_pagamento === 'pix') {
      const pix = resp.next_action?.pix_display_qr_code;
      pixInfo = {
        qr_code: pix?.data,
        qr_code_url: pix?.image_url_png,
        expiracao: pix?.expires_at ? new Date(pix.expires_at * 1000) : null,
      };
    } else if (pedido.metodo_pagamento === 'boleto') {
      boletoUrl = resp.next_action?.boleto_display_details?.hosted_voucher_url ?? null;
    }
  }

  return { pedido, itens: itensRes.rows, pagamento: pagamento ?? null, pixInfo, boletoUrl };
}
