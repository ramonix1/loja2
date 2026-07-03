import { getConfigs, getLojaInfo } from '../../lib/config.js';
import {
  orderStatusToApi,
  paymentStatusToApi,
  paymentStatusToDb,
} from '../../lib/merchant-schema-map.js';
import type { StoreScope } from '../../lib/store-scope.js';
import { validateCheckoutData } from '../../lib/validation.js';
import { getCartItems } from '../cart/cart.service.js';
import { recordCommissionOnMerchantOrder } from '../../services/merchant-billing.service.js';
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

async function getScheduleDisponibilidade(scope: StoreScope, data: string) {
  const configRes = await scope.pool.query(
    'SELECT daily_capacity FROM schedule_config WHERE store_id = $1 LIMIT 1',
    [scope.storeId],
  );
  const capacidadeDiaria = Number(configRes.rows[0]?.daily_capacity ?? 1);

  const especial = await scope.pool.query(
    'SELECT capacity, reason FROM schedule_special_days WHERE store_id = $1 AND date = $2',
    [scope.storeId, data],
  );
  const e = especial.rows[0] as { capacity: number | null; reason: string | null } | undefined;

  let capacidade = capacidadeDiaria;
  let bloqueado = false;
  let motivo: string | null = null;

  if (e) {
    motivo = e.reason;
    if (e.capacity === null || e.capacity === 0) {
      bloqueado = true;
    } else {
      capacidade = e.capacity;
    }
  }

  if (bloqueado) {
    return { disponivel: false, vagas_total: 0, vagas_usadas: 0, vagas_livres: 0, bloqueado: true, motivo };
  }

  const r = await scope.pool.query(
    "SELECT COUNT(*) FROM appointments WHERE store_id = $1 AND event_date = $2 AND status = 'confirmed'",
    [scope.storeId, data],
  );
  const vagas_usadas = parseInt(String(r.rows[0]?.count ?? 0), 10);
  const vagas_livres = Math.max(0, capacidade - vagas_usadas);

  return {
    disponivel: vagas_livres > 0,
    vagas_total: capacidade,
    vagas_usadas,
    vagas_livres,
    bloqueado: false,
    motivo,
  };
}

async function getAgendaConfigForCheckout(scope: StoreScope) {
  const r = await scope.pool.query(
    'SELECT daily_capacity, min_lead_days, max_lead_days FROM schedule_config WHERE store_id = $1 LIMIT 1',
    [scope.storeId],
  );
  const row = r.rows[0];
  return {
    capacidade_diaria: Number(row?.daily_capacity ?? 1),
    antecedencia_minima_dias: Number(row?.min_lead_days ?? 1),
    antecedencia_maxima_dias: Number(row?.max_lead_days ?? 180),
  };
}

function mapOrderRowToApi(row: Record<string, unknown>) {
  return {
    id: row.id,
    usuario_id: row.buyer_id,
    nome_entrega: row.shipping_name,
    email_entrega: row.shipping_email,
    telefone_entrega: row.shipping_phone,
    cpf_entrega: row.shipping_cpf,
    cep: row.shipping_postal_code,
    logradouro: row.shipping_street,
    numero: row.shipping_number,
    complemento: row.shipping_complement,
    bairro: row.shipping_district,
    cidade: row.shipping_city,
    estado: row.shipping_state,
    subtotal: row.subtotal,
    frete: row.shipping_fee,
    frete_servico: row.shipping_service,
    total: row.total,
    status: orderStatusToApi(String(row.status)),
    metodo_pagamento: row.payment_method,
    mp_payment_id: row.mp_payment_id,
    data_evento: row.event_date,
    codigo_rastreio: row.tracking_code,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapOrderItemRowToApi(row: Record<string, unknown>) {
  return {
    id: row.id,
    pedido_id: row.order_id,
    produto_id: row.product_id,
    nome_produto: row.product_name,
    quantidade: row.quantity,
    preco_unitario: row.unit_price,
    subtotal: row.subtotal,
  };
}

function mapPaymentRowToApi(row: Record<string, unknown>) {
  return {
    id: row.id,
    pedido_id: row.order_id,
    mp_payment_id: row.mp_payment_id,
    status: paymentStatusToApi(String(row.status)),
    status_mp: row.status_mp,
    valor: row.amount,
    metodo: row.method,
    resposta_json: row.raw_response,
    created_at: row.created_at,
  };
}

async function notificarPedidoPago(
  scope: StoreScope,
  pedidoId: number,
  itens: Awaited<ReturnType<typeof getCartItems>>,
) {
  try {
    const loja = await getLojaInfo(scope);
    if (!loja.email) return;
    const pedidoRes = await scope.pool.query(
      'SELECT id, total, payment_method AS metodo_pagamento FROM orders WHERE id = $1 AND store_id = $2',
      [pedidoId, scope.storeId],
    );
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

async function registrarComissao(merchantId: number, pedidoId: number, total: number) {
  try {
    await recordCommissionOnMerchantOrder(merchantId, pedidoId, total);
  } catch (err) {
    console.error('[Billing] Erro ao registrar comissão:', err instanceof Error ? err.message : err);
  }
}

export async function getCheckoutPreview(scope: StoreScope, buyerId: number) {
  const itens = await getCartItems(scope, buyerId);
  const subtotal = itens.reduce((s, i) => s + i.subtotal, 0);
  const configs = await getConfigs(scope);
  const moduloAgenda = configs.modulo_agenda === 'true';
  const agendaConfig = moduloAgenda ? await getAgendaConfigForCheckout(scope) : null;
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
  scope: StoreScope,
  buyerId: number,
  input: CheckoutInput,
): Promise<CheckoutResult> {
  const { pool, storeId, merchantId } = scope;
  const erros = validateCheckoutData(input);
  if (erros.length > 0) {
    return { ok: false, error: erros.join('; '), code: 'VALIDATION_ERROR', status: 400 };
  }

  const freteNum = input.frete_valor !== undefined ? parseFloat(String(input.frete_valor)) : 0;
  if (Number.isNaN(freteNum) || freteNum < 0) {
    return { ok: false, error: 'Frete inválido.', code: 'INVALID_SHIPPING', status: 400 };
  }

  const configs = await getConfigs(scope);
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
    const disp = await getScheduleDisponibilidade(scope, input.data_evento);
    if (!disp.disponivel) {
      return {
        ok: false,
        error: 'Data indisponível.',
        code: 'EVENT_DATE_UNAVAILABLE',
        status: 400,
      };
    }
  }

  await pool.query('BEGIN');

  try {
    const itens = await getCartItems(scope, buyerId);
    if (itens.length === 0) {
      await pool.query('ROLLBACK');
      return { ok: false, error: 'Carrinho vazio.', code: 'EMPTY_CART', status: 400 };
    }

    if (configs.controla_estoque === 'true') {
      for (const item of itens) {
        const prod = await pool.query(
          'SELECT stock AS estoque FROM products WHERE id = $1 AND store_id = $2',
          [item.produto_id, storeId],
        );
        const estoque = prod.rows[0]?.estoque as number | null;
        if (estoque !== null && item.quantidade > estoque) {
          await pool.query('ROLLBACK');
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

    const pedidoRes = await pool.query<{ id: number }>(
      `INSERT INTO orders
         (store_id, buyer_id, shipping_name, shipping_email, shipping_phone, shipping_cpf,
          shipping_postal_code, shipping_street, shipping_number, shipping_complement,
          shipping_district, shipping_city, shipping_state,
          subtotal, shipping_fee, shipping_service, total, status, payment_method)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,'awaiting_payment',$18)
       RETURNING id`,
      [
        storeId,
        buyerId,
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
      await pool.query(
        `INSERT INTO order_items
           (store_id, order_id, product_id, product_name, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          storeId,
          pedidoId,
          item.produto_id,
          item.nome,
          item.quantidade,
          item.preco_unitario,
          item.subtotal,
        ],
      );
    }

    if (moduloAgenda && input.data_evento) {
      await pool.query(
        'INSERT INTO appointments (store_id, order_id, event_date) VALUES ($1, $2, $3)',
        [storeId, pedidoId, input.data_evento],
      );
      await pool.query('UPDATE orders SET event_date = $1 WHERE id = $2 AND store_id = $3', [
        input.data_evento,
        pedidoId,
        storeId,
      ]);
    }

    if (configs.controla_estoque === 'true') {
      for (const item of itens) {
        await pool.query(
          'UPDATE products SET stock = GREATEST(0, stock - $1), updated_at = NOW() WHERE id = $2 AND store_id = $3 AND stock IS NOT NULL',
          [item.quantidade, item.produto_id, storeId],
        );
        await pool.query(
          `INSERT INTO inventory_movements
             (store_id, product_id, type, quantity, source, source_id)
           VALUES ($1, $2, 'outbound', $3, 'order', $4)`,
          [storeId, item.produto_id, item.quantidade, pedidoId],
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
        await pool.query('ROLLBACK');
        return { ok: false, error: 'Método inválido.', code: 'INVALID_PAYMENT', status: 400 };
      }

      await pool.query(
        `INSERT INTO payments
           (store_id, order_id, mp_payment_id, status, status_mp, amount, method, raw_response)
         VALUES ($1, $2, $3, 'paid', 'approved', $4, 'teste', $5)`,
        [storeId, pedidoId, `TESTE-${pedidoId}`, total, JSON.stringify({ test: true })],
      );
      await pool.query(
        "UPDATE orders SET status = 'paid', mp_payment_id = $1 WHERE id = $2 AND store_id = $3",
        [`TESTE-${pedidoId}`, pedidoId, storeId],
      );
      await pool.query('DELETE FROM cart_items WHERE buyer_id = $1 AND store_id = $2', [
        buyerId,
        storeId,
      ]);
      await pool.query('COMMIT');

      void notificarPedidoPago(scope, pedidoId, itens);
      await registrarComissao(merchantId, pedidoId, total);

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

      await pool.query(
        `INSERT INTO payments
           (store_id, order_id, mp_payment_id, status, status_mp, amount, method, raw_response)
         VALUES ($1, $2, $3, 'pending', 'PENDING', $4, 'sumup_online', $5)`,
        [storeId, pedidoId, checkoutSumup.id, total, JSON.stringify(checkoutSumup)],
      );
      await pool.query(
        "UPDATE orders SET status = 'awaiting_payment', mp_payment_id = $1 WHERE id = $2 AND store_id = $3",
        [checkoutSumup.id, pedidoId, storeId],
      );
      await pool.query('DELETE FROM cart_items WHERE buyer_id = $1 AND store_id = $2', [
        buyerId,
        storeId,
      ]);
      await pool.query('COMMIT');

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
        await pool.query('ROLLBACK');
        return { ok: false, error: 'Método inválido.', code: 'INVALID_PAYMENT', status: 400 };
      }
      stripeResult = await stripeService.criarPagamentoCartao({
        ...dadosPagador,
        paymentMethodId: input.stripe_payment_method_id,
      });
    } else {
      await pool.query('ROLLBACK');
      return { ok: false, error: 'Método inválido.', code: 'INVALID_PAYMENT', status: 400 };
    }

    const statusInterno = stripeService.mapearStatus(stripeResult.status);
    const statusDb = paymentStatusToDb(statusInterno);
    const orderStatusDb = statusInterno === 'pago' ? 'paid' : 'awaiting_payment';

    await pool.query(
      `INSERT INTO payments
         (store_id, order_id, mp_payment_id, status, status_mp, amount, method, raw_response)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        storeId,
        pedidoId,
        stripeResult.id,
        statusDb,
        stripeResult.status,
        total,
        input.metodo_pagamento,
        JSON.stringify(stripeResult),
      ],
    );

    await pool.query('UPDATE orders SET status = $1, mp_payment_id = $2 WHERE id = $3 AND store_id = $4', [
      orderStatusDb,
      stripeResult.id,
      pedidoId,
      storeId,
    ]);

    let redirectUrl: string | undefined;
    if (
      input.metodo_pagamento === 'cartao' &&
      stripeResult.status === 'requires_action' &&
      stripeResult.next_action?.type === 'redirect_to_url'
    ) {
      redirectUrl = stripeResult.next_action.redirect_to_url?.url ?? undefined;
    }

    await pool.query('DELETE FROM cart_items WHERE buyer_id = $1 AND store_id = $2', [buyerId, storeId]);
    await pool.query('COMMIT');

    if (statusInterno === 'pago') {
      void notificarPedidoPago(scope, pedidoId, itens);
      await registrarComissao(merchantId, pedidoId, total);
    }

    return {
      ok: true,
      pedido_id: pedidoId,
      status: statusInterno === 'pago' ? 'pago' : 'aguardando_pagamento',
      redirect_url: redirectUrl,
    };
  } catch (err) {
    await pool.query('ROLLBACK').catch(() => {});
    console.error('[Checkout] Erro:', err);
    return {
      ok: false,
      error: 'Erro ao processar pagamento.',
      code: 'CHECKOUT_ERROR',
      status: 500,
    };
  }
}

export async function getCheckoutResult(scope: StoreScope, buyerId: number, pedidoId: number) {
  const pedidoRes = await scope.pool.query(
    `SELECT * FROM orders WHERE id = $1 AND buyer_id = $2 AND store_id = $3`,
    [pedidoId, buyerId, scope.storeId],
  );
  if (!pedidoRes.rows[0]) return null;

  const itensRes = await scope.pool.query(
    'SELECT * FROM order_items WHERE order_id = $1 AND store_id = $2',
    [pedidoId, scope.storeId],
  );
  const pagamentoRes = await scope.pool.query(
    'SELECT * FROM payments WHERE order_id = $1 AND store_id = $2 ORDER BY id DESC LIMIT 1',
    [pedidoId, scope.storeId],
  );

  const pedidoRaw = pedidoRes.rows[0] as Record<string, unknown>;
  const pedido = mapOrderRowToApi(pedidoRaw);
  const pagamentoRaw = pagamentoRes.rows[0] as Record<string, unknown> | undefined;
  const pagamento = pagamentoRaw ? mapPaymentRowToApi(pagamentoRaw) : null;

  let pixInfo: Record<string, unknown> | null = null;
  let boletoUrl: string | null = null;

  if (pagamentoRaw) {
    const resp = JSON.parse(String(pagamentoRaw.raw_response || '{}')) as {
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

  return {
    pedido,
    itens: itensRes.rows.map((row) => mapOrderItemRowToApi(row as Record<string, unknown>)),
    pagamento,
    pixInfo,
    boletoUrl,
  };
}
