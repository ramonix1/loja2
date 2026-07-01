import type pg from 'pg';

import { getConfigs, getLojaInfo } from '../../lib/config.js';
import { validateCheckoutData } from '../../lib/validation.js';
import { enviarNotificacaoPedidoPago } from '../../services/email.service.js';
import * as stripeService from '../../services/stripe.service.js';
import * as sumupService from '../../services/sumup.service.js';
import { getAgendaConfig, getDisponibilidade } from '../agenda/agenda.service.js';
import { recordCommissionOnOrder } from '../billing/billing.service.js';
import { getCartItems } from '../cart/cart.service.js';
import type { CartItem } from '../cart/cart.service.js';
import {
  decrementProductStock,
  deleteCartItemsByUser,
  findLatestPagamento,
  findPedidoById,
  findPedidoByIdAndUser,
  findPedidoItens,
  findProductStock,
  insertAgendamento,
  insertMovimentacaoEstoque,
  insertPagamento,
  insertPedido,
  insertPedidoItem,
  updatePedidoStatusAndPayment,
} from './checkout.repository.js';
import type { CheckoutInput, CheckoutResult } from './checkout.schema.js';

async function notificarPedidoPago(db: pg.Pool, pedidoId: number, itens: CartItem[]) {
  try {
    const loja = await getLojaInfo(db);
    if (!loja.email) return;
    const pedido = await findPedidoById(db, pedidoId);
    if (!pedido) return;
    await enviarNotificacaoPedidoPago({
      lojaNome: loja.nome,
      lojaEmail: loja.email,
      pedido: pedido as { id: number; total: number; metodo_pagamento?: string },
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

    if (configs.controla_estoque === 'true') {
      for (const item of itens) {
        const estoque = await findProductStock(db, item.produto_id);
        if (estoque !== null && estoque !== undefined && item.quantidade > estoque) {
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

    const pedidoId = await insertPedido(db, {
      usuarioId,
      nome_entrega: input.nome_entrega,
      email_entrega: input.email_entrega,
      telefone_entrega: input.telefone_entrega ?? null,
      cpf_entrega: input.cpf_entrega ?? null,
      cep: input.cep,
      logradouro: input.logradouro,
      numero: input.numero,
      complemento: input.complemento ?? null,
      bairro: input.bairro ?? null,
      cidade: input.cidade,
      estado: input.estado,
      subtotal,
      frete,
      freteServico,
      total,
      metodo_pagamento: input.metodo_pagamento,
    });

    for (const item of itens) {
      await insertPedidoItem(
        db,
        pedidoId,
        item.produto_id,
        item.nome,
        item.quantidade,
        item.preco_unitario,
        item.subtotal,
      );
    }

    if (moduloAgenda && input.data_evento) {
      await insertAgendamento(db, pedidoId, input.data_evento);
    }

    if (configs.controla_estoque === 'true') {
      for (const item of itens) {
        await decrementProductStock(db, item.produto_id, item.quantidade);
        await insertMovimentacaoEstoque(db, item.produto_id, item.quantidade, pedidoId);
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

      await insertPagamento(db, {
        pedidoId,
        mpPaymentId: `TESTE-${pedidoId}`,
        status: 'pago',
        statusMp: 'approved',
        valor: total,
        metodo: 'teste',
        respostaJson: JSON.stringify({ test: true }),
      });
      await updatePedidoStatusAndPayment(db, pedidoId, 'pago', `TESTE-${pedidoId}`);
      await deleteCartItemsByUser(db, usuarioId);
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

      await insertPagamento(db, {
        pedidoId,
        mpPaymentId: checkoutSumup.id,
        status: 'pendente',
        statusMp: 'PENDING',
        valor: total,
        metodo: 'sumup_online',
        respostaJson: JSON.stringify(checkoutSumup),
      });
      await updatePedidoStatusAndPayment(db, pedidoId, 'aguardando_pagamento', checkoutSumup.id);
      await deleteCartItemsByUser(db, usuarioId);
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

    await insertPagamento(db, {
      pedidoId,
      mpPaymentId: stripeResult.id,
      status: statusInterno,
      statusMp: stripeResult.status,
      valor: total,
      metodo: input.metodo_pagamento,
      respostaJson: JSON.stringify(stripeResult),
    });

    await updatePedidoStatusAndPayment(
      db,
      pedidoId,
      statusInterno === 'pago' ? 'pago' : 'aguardando_pagamento',
      stripeResult.id,
    );

    let redirectUrl: string | undefined;
    if (
      input.metodo_pagamento === 'cartao' &&
      stripeResult.status === 'requires_action' &&
      stripeResult.next_action?.type === 'redirect_to_url'
    ) {
      redirectUrl = stripeResult.next_action.redirect_to_url?.url ?? undefined;
    }

    await deleteCartItemsByUser(db, usuarioId);
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
  const pedido = await findPedidoByIdAndUser(db, pedidoId, usuarioId);
  if (!pedido) return null;

  const itens = await findPedidoItens(db, pedidoId);
  const pagamento = await findLatestPagamento(db, pedidoId);

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

  return { pedido, itens, pagamento: pagamento ?? null, pixInfo, boletoUrl };
}
