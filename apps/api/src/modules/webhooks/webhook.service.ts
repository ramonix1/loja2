import type pg from 'pg';

import * as sumupService from '../../services/sumup.service.js';
import { recordCommissionOnOrder } from '../billing/billing.service.js';
import {
  findPagamentoByMpId,
  findPedidoStatus,
  findPedidoTotal,
  isEventProcessed,
  markEventProcessed,
  updatePagamentoPago,
  updatePagamentoRejeitado,
  updatePagamentoStatus,
  updatePedidoPago,
  updatePedidoStatus,
} from './webhook.repository.js';
import type { StripeWebhookEvent, SumupWebhookEvent, WebhookProcessResult } from './webhook.schema.js';

async function marcarPedidoPago(
  db: pg.Pool,
  paymentId: string,
  tenantId?: number,
): Promise<number | null> {
  await updatePagamentoPago(db, paymentId);
  const pagamento = await findPagamentoByMpId(db, paymentId);
  if (!pagamento) return null;

  const pedidoId = pagamento.pedido_id;
  const prevStatus = await findPedidoStatus(db, pedidoId);

  await updatePedidoPago(db, pedidoId);

  if (prevStatus !== 'pago' && tenantId) {
    const total = (await findPedidoTotal(db, pedidoId)) ?? parseFloat(String(pagamento.valor));
    void recordCommissionOnOrder(tenantId, pedidoId, total).catch(console.error);
  }

  return pedidoId;
}

export async function processStripeWebhook(
  db: pg.Pool,
  event: StripeWebhookEvent,
  tenantId?: number,
): Promise<WebhookProcessResult> {
  const eventId = event.id ?? `${event.type}-${Date.now()}`;
  const eventType = event.type ?? 'unknown';

  if (await isEventProcessed(db, 'stripe', eventId)) {
    return { processed: false };
  }

  let pedidoId: number | null = null;

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data?.object;
    if (pi?.id) {
      pedidoId = await marcarPedidoPago(db, String(pi.id), tenantId);
    }
  } else if (event.type === 'checkout.session.completed') {
    const session = event.data?.object;
    const paymentIntent = session?.payment_intent ?? session?.payment_intent_id;
    if (paymentIntent) {
      pedidoId = await marcarPedidoPago(db, String(paymentIntent), tenantId);
    }
  } else if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data?.object;
    if (pi?.id) {
      await updatePagamentoRejeitado(db, pi.status, String(pi.id));
    }
  }

  const inserted = await markEventProcessed(db, 'stripe', eventId, eventType);
  return { processed: inserted, pedidoId };
}

export async function processSumupWebhook(
  db: pg.Pool,
  evento: SumupWebhookEvent,
  tenantId?: number,
): Promise<{ processed: boolean }> {
  const checkoutId = String(evento.id ?? evento.checkout_id ?? '');
  const eventId = checkoutId || JSON.stringify(evento).slice(0, 200);

  if (await isEventProcessed(db, 'sumup', eventId)) {
    return { processed: false };
  }

  if (
    evento.event_type === 'CHECKOUT_STATUS_CHANGED' ||
    evento.type === 'payment' ||
    checkoutId
  ) {
    if (checkoutId) {
      const checkout = await sumupService.consultarCheckout(checkoutId);
      const statusInterno = sumupService.mapearStatus(checkout.status ?? '');

      await updatePagamentoStatus(db, statusInterno, checkout.status, checkoutId);

      const pagamento = await findPagamentoByMpId(db, checkoutId);
      if (pagamento) {
        const novoStatus =
          statusInterno === 'pago'
            ? 'pago'
            : statusInterno === 'rejeitado'
              ? 'cancelado'
              : 'aguardando_pagamento';

        const prevStatus = await findPedidoStatus(db, pagamento.pedido_id);
        await updatePedidoStatus(db, pagamento.pedido_id, novoStatus);

        if (novoStatus === 'pago' && prevStatus !== 'pago' && tenantId) {
          const total = parseFloat(String(pagamento.valor));
          void recordCommissionOnOrder(tenantId, pagamento.pedido_id, total).catch(console.error);
        }
      }
    }
  }

  await markEventProcessed(db, 'sumup', eventId, String(evento.event_type ?? evento.type ?? 'unknown'));
  return { processed: true };
}
