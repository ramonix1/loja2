import type pg from 'pg';

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

export async function updatePagamentoPago(db: pg.Pool, paymentId: string): Promise<void> {
  await db.query("UPDATE pagamentos SET status = 'pago', status_mp = 'succeeded' WHERE mp_payment_id = $1", [
    paymentId,
  ]);
}

export async function findPagamentoByMpId(
  db: pg.Pool,
  paymentId: string,
): Promise<{ pedido_id: number; valor: string } | null> {
  const r = await db.query<{ pedido_id: number; valor: string }>(
    'SELECT pedido_id, valor FROM pagamentos WHERE mp_payment_id = $1 LIMIT 1',
    [paymentId],
  );
  return r.rows[0] ?? null;
}

export async function findPedidoStatus(db: pg.Pool, pedidoId: number): Promise<string | undefined> {
  const wasPending = await db.query('SELECT status FROM pedidos WHERE id = $1', [pedidoId]);
  return wasPending.rows[0]?.status as string | undefined;
}

export async function updatePedidoPago(db: pg.Pool, pedidoId: number): Promise<void> {
  await db.query("UPDATE pedidos SET status = 'pago' WHERE id = $1", [pedidoId]);
}

export async function findPedidoTotal(db: pg.Pool, pedidoId: number): Promise<number | null> {
  const pedido = await db.query<{ total: string }>('SELECT total FROM pedidos WHERE id = $1', [pedidoId]);
  const total = pedido.rows[0]?.total;
  return total != null ? parseFloat(String(total)) : null;
}

export async function updatePagamentoRejeitado(
  db: pg.Pool,
  statusMp: unknown,
  paymentId: string,
): Promise<void> {
  await db.query(
    "UPDATE pagamentos SET status = 'rejeitado', status_mp = $1 WHERE mp_payment_id = $2",
    [statusMp, paymentId],
  );
}

export async function updatePagamentoStatus(
  db: pg.Pool,
  statusInterno: string,
  statusMp: string | undefined,
  checkoutId: string,
): Promise<void> {
  await db.query('UPDATE pagamentos SET status = $1, status_mp = $2 WHERE mp_payment_id = $3', [
    statusInterno,
    statusMp,
    checkoutId,
  ]);
}

export async function updatePedidoStatus(db: pg.Pool, pedidoId: number, status: string): Promise<void> {
  await db.query('UPDATE pedidos SET status = $1 WHERE id = $2', [status, pedidoId]);
}
