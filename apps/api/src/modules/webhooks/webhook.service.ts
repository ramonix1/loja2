import type pg from 'pg';

import { recordCommissionOnOrder } from '../../services/billing.service.js';
import * as sumupService from '../../services/sumup.service.js';

/** Garante tabela de idempotência de webhooks no tenant DB. */
export async function ensureWebhookEventsTable(db: pg.Pool): Promise<void> {
  await db.query(`
    CREATE TABLE IF NOT EXISTS webhook_events (
      id SERIAL PRIMARY KEY,
      provider VARCHAR(20) NOT NULL,
      event_id VARCHAR(255) NOT NULL,
      event_type VARCHAR(100),
      processed_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(provider, event_id)
    )
  `);
}

export async function isEventProcessed(
  db: pg.Pool,
  provider: string,
  eventId: string,
): Promise<boolean> {
  await ensureWebhookEventsTable(db);
  const r = await db.query(
    'SELECT id FROM webhook_events WHERE provider = $1 AND event_id = $2',
    [provider, eventId],
  );
  return r.rows.length > 0;
}

export async function markEventProcessed(
  db: pg.Pool,
  provider: string,
  eventId: string,
  eventType: string,
): Promise<boolean> {
  await ensureWebhookEventsTable(db);
  try {
    await db.query(
      'INSERT INTO webhook_events (provider, event_id, event_type) VALUES ($1, $2, $3)',
      [provider, eventId, eventType],
    );
    return true;
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '23505') return false;
    throw err;
  }
}

async function marcarPedidoPago(
  db: pg.Pool,
  paymentId: string,
  tenantId?: number,
): Promise<number | null> {
  await db.query("UPDATE pagamentos SET status = 'pago', status_mp = 'succeeded' WHERE mp_payment_id = $1", [
    paymentId,
  ]);
  const r = await db.query<{ pedido_id: number; valor: string }>(
    'SELECT pedido_id, valor FROM pagamentos WHERE mp_payment_id = $1 LIMIT 1',
    [paymentId],
  );
  if (!r.rows[0]) return null;

  const pedidoId = r.rows[0].pedido_id;
  const wasPending = await db.query(
    "SELECT status FROM pedidos WHERE id = $1",
    [pedidoId],
  );
  const prevStatus = wasPending.rows[0]?.status as string | undefined;

  await db.query("UPDATE pedidos SET status = 'pago' WHERE id = $1", [pedidoId]);

  if (prevStatus !== 'pago' && tenantId) {
    const pedido = await db.query<{ total: string }>('SELECT total FROM pedidos WHERE id = $1', [
      pedidoId,
    ]);
    const total = parseFloat(String(pedido.rows[0]?.total ?? r.rows[0].valor));
    void recordCommissionOnOrder(tenantId, pedidoId, total).catch(console.error);
  }

  return pedidoId;
}

export async function processStripeWebhook(
  db: pg.Pool,
  event: { id?: string; type?: string; data?: { object?: Record<string, unknown> } },
  tenantId?: number,
): Promise<{ processed: boolean; pedidoId?: number | null }> {
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
      await db.query(
        "UPDATE pagamentos SET status = 'rejeitado', status_mp = $1 WHERE mp_payment_id = $2",
        [pi.status, pi.id],
      );
    }
  }

  const inserted = await markEventProcessed(db, 'stripe', eventId, eventType);
  return { processed: inserted, pedidoId };
}

export async function processSumupWebhook(
  db: pg.Pool,
  evento: Record<string, unknown>,
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

      await db.query(
        'UPDATE pagamentos SET status = $1, status_mp = $2 WHERE mp_payment_id = $3',
        [statusInterno, checkout.status, checkoutId],
      );

      const pedidoRes = await db.query<{ pedido_id: number; valor: string }>(
        'SELECT pedido_id, valor FROM pagamentos WHERE mp_payment_id = $1',
        [checkoutId],
      );
      if (pedidoRes.rows[0]) {
        const novoStatus =
          statusInterno === 'pago'
            ? 'pago'
            : statusInterno === 'rejeitado'
              ? 'cancelado'
              : 'aguardando_pagamento';

        const prev = await db.query('SELECT status FROM pedidos WHERE id = $1', [
          pedidoRes.rows[0].pedido_id,
        ]);
        await db.query('UPDATE pedidos SET status = $1 WHERE id = $2', [
          novoStatus,
          pedidoRes.rows[0].pedido_id,
        ]);

        if (novoStatus === 'pago' && prev.rows[0]?.status !== 'pago' && tenantId) {
          const total = parseFloat(String(pedidoRes.rows[0].valor));
          void recordCommissionOnOrder(tenantId, pedidoRes.rows[0].pedido_id, total).catch(
            console.error,
          );
        }
      }
    }
  }

  await markEventProcessed(db, 'sumup', eventId, String(evento.event_type ?? evento.type ?? 'unknown'));
  return { processed: true };
}
