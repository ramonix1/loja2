import type {
  AgendaConfig,
  SaveAgendaDiaInput,
  UpdateAgendaConfigInput,
} from '@lojao/types/agenda';

import type { StoreScope } from '../../lib/store-scope.js';

export async function findAgendaConfig({ pool, storeId }: StoreScope): Promise<AgendaConfig> {
  const r = await pool.query('SELECT * FROM schedule_config WHERE store_id = $1', [storeId]);
  const row = r.rows[0];
  return {
    capacidade_diaria: Number(row?.daily_capacity ?? 1),
    antecedencia_minima_dias: Number(row?.min_lead_days ?? 1),
    antecedencia_maxima_dias: Number(row?.max_lead_days ?? 180),
  };
}

export async function findSpecialDay(
  { pool, storeId }: StoreScope,
  data: string,
): Promise<{ capacity: number | null; reason: string | null } | undefined> {
  const r = await pool.query(
    'SELECT * FROM schedule_special_days WHERE store_id = $1 AND date = $2',
    [storeId, data],
  );
  return r.rows[0] as { capacity: number | null; reason: string | null } | undefined;
}

export async function findSpecialDaysInRange(
  { pool, storeId }: StoreScope,
  from: string,
  to: string,
): Promise<Array<{ data: string; capacidade: number | null; motivo: string | null }>> {
  const r = await pool.query(
    `SELECT date::text AS data, capacity, reason AS motivo
     FROM schedule_special_days
     WHERE store_id = $1 AND date BETWEEN $2 AND $3
     ORDER BY date`,
    [storeId, from, to],
  );
  return r.rows.map((e) => ({
    data: String(e.data).slice(0, 10),
    capacidade: e.capacity === null ? null : Number(e.capacity),
    motivo: (e.motivo as string | null) ?? null,
  }));
}

export async function findAppointmentCountsInRange(
  { pool, storeId }: StoreScope,
  from: string,
  to: string,
): Promise<Record<string, number>> {
  const r = await pool.query(
    `SELECT event_date::text AS data, COUNT(*)::int AS count
     FROM appointments
     WHERE store_id = $1 AND event_date BETWEEN $2 AND $3 AND status = 'confirmed'
     GROUP BY event_date`,
    [storeId, from, to],
  );
  const map: Record<string, number> = {};
  for (const row of r.rows as { data: string; count: number }[]) {
    map[row.data] = Number(row.count);
  }
  return map;
}

export async function findConfirmedAppointmentCount(
  { pool, storeId }: StoreScope,
  data: string,
): Promise<number> {
  const r = await pool.query(
    "SELECT COUNT(*) FROM appointments WHERE store_id = $1 AND event_date = $2 AND status = 'confirmed'",
    [storeId, data],
  );
  return parseInt(String(r.rows[0]?.count ?? 0), 10);
}

export async function upsertAgendaConfig(
  { pool, storeId }: StoreScope,
  input: UpdateAgendaConfigInput,
): Promise<void> {
  await pool.query(
    `INSERT INTO schedule_config (store_id, daily_capacity, min_lead_days, max_lead_days, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (store_id) DO UPDATE SET
       daily_capacity = $2,
       min_lead_days = $3,
       max_lead_days = $4,
       updated_at = NOW()`,
    [
      storeId,
      input.capacidade_diaria,
      input.antecedencia_minima_dias,
      input.antecedencia_maxima_dias,
    ],
  );
}

export async function upsertSpecialDay(
  { pool, storeId }: StoreScope,
  input: SaveAgendaDiaInput,
): Promise<void> {
  const cap =
    input.capacidade === undefined || input.capacidade === null ? null : Number(input.capacidade);
  await pool.query(
    `INSERT INTO schedule_special_days (store_id, date, capacity, reason)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (store_id, date) DO UPDATE SET capacity = $3, reason = $4`,
    [storeId, input.data, cap, input.motivo ?? null],
  );
}

export async function deleteSpecialDay(
  { pool, storeId }: StoreScope,
  data: string,
): Promise<boolean> {
  const r = await pool.query(
    'DELETE FROM schedule_special_days WHERE store_id = $1 AND date = $2',
    [storeId, data],
  );
  return (r.rowCount ?? 0) > 0;
}
