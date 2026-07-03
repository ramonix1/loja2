import type {
  AgendaAdminData,
  AgendaConfig,
  SaveAgendaDiaInput,
  UpdateAgendaConfigInput,
} from '@lojao/types/agenda';

import type { StoreScope } from '../../lib/store-scope.js';

export async function getAgendaConfig({ pool, storeId }: StoreScope): Promise<AgendaConfig> {
  const r = await pool.query('SELECT * FROM schedule_config WHERE store_id = $1', [storeId]);
  const row = r.rows[0];
  return {
    capacidade_diaria: Number(row?.daily_capacity ?? 1),
    antecedencia_minima_dias: Number(row?.min_lead_days ?? 1),
    antecedencia_maxima_dias: Number(row?.max_lead_days ?? 180),
  };
}

function parseMes(mes?: string): { mes: string; ano: number; mesNum: number; lastDay: number } {
  const ref = mes ?? new Date().toISOString().slice(0, 7);
  const parts = ref.split('-');
  const ano = Number(parts[0]) || new Date().getFullYear();
  const mesNum = Number(parts[1]) || new Date().getMonth() + 1;
  const lastDay = new Date(ano, mesNum, 0).getDate();
  return { mes: ref, ano, mesNum, lastDay };
}

/** Porta `agendaController.getDisponibilidade`. */
export async function getDisponibilidade(scope: StoreScope, data: string) {
  const config = await getAgendaConfig(scope);
  const { pool, storeId } = scope;

  const especial = await pool.query(
    'SELECT * FROM schedule_special_days WHERE store_id = $1 AND date = $2',
    [storeId, data],
  );
  const e = especial.rows[0] as { capacity: number | null; reason: string | null } | undefined;

  let capacidade = config.capacidade_diaria;
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

  const r = await pool.query(
    "SELECT COUNT(*) FROM appointments WHERE store_id = $1 AND event_date = $2 AND status = 'confirmed'",
    [storeId, data],
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

/** Porta `agendaController.exibirAgenda`. */
export async function getAgendaAdmin(scope: StoreScope, mesParam?: string): Promise<AgendaAdminData> {
  const config = await getAgendaConfig(scope);
  const { pool, storeId } = scope;
  const { mes, ano, mesNum, lastDay } = parseMes(mesParam);
  const pad = (n: number) => String(n).padStart(2, '0');
  const inicio = `${mes}-01`;
  const fim = `${mes}-${pad(lastDay)}`;

  const [especiaisRes, agendadosRes] = await Promise.all([
    pool.query(
      `SELECT date::text AS data, capacity, reason AS motivo
       FROM schedule_special_days
       WHERE store_id = $1 AND date BETWEEN $2 AND $3
       ORDER BY date`,
      [storeId, inicio, fim],
    ),
    pool.query(
      `SELECT event_date::text AS data, COUNT(*)::int AS count
       FROM appointments
       WHERE store_id = $1 AND event_date BETWEEN $2 AND $3 AND status = 'confirmed'
       GROUP BY event_date`,
      [storeId, inicio, fim],
    ),
  ]);

  const agendadosMap: Record<string, number> = {};
  for (const row of agendadosRes.rows as { data: string; count: number }[]) {
    agendadosMap[row.data] = Number(row.count);
  }

  return {
    config,
    mes,
    ano,
    mesNum,
    lastDay,
    especiais: especiaisRes.rows.map((e) => ({
      data: String(e.data).slice(0, 10),
      capacidade: e.capacity === null ? null : Number(e.capacity),
      motivo: (e.motivo as string | null) ?? null,
    })),
    agendadosMap,
  };
}

/** Porta `agendaController.salvarConfig`. */
export async function updateAgendaConfig(
  scope: StoreScope,
  input: UpdateAgendaConfigInput,
): Promise<AgendaConfig> {
  const { pool, storeId } = scope;
  await pool.query(
    `INSERT INTO schedule_config (store_id, daily_capacity, min_lead_days, max_lead_days, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (store_id) DO UPDATE SET
       daily_capacity = $2,
       min_lead_days = $3,
       max_lead_days = $4,
       updated_at = NOW()`,
    [storeId, input.capacidade_diaria, input.antecedencia_minima_dias, input.antecedencia_maxima_dias],
  );
  return getAgendaConfig(scope);
}

/** Porta `agendaController.salvarDia`. */
export async function saveAgendaDia(scope: StoreScope, input: SaveAgendaDiaInput): Promise<void> {
  const { pool, storeId } = scope;
  const cap =
    input.capacidade === undefined || input.capacidade === null ? null : Number(input.capacidade);
  await pool.query(
    `INSERT INTO schedule_special_days (store_id, date, capacity, reason)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (store_id, date) DO UPDATE SET capacity = $3, reason = $4`,
    [storeId, input.data, cap, input.motivo ?? null],
  );
}

/** Porta `agendaController.removerDia`. */
export async function removeAgendaDia(scope: StoreScope, data: string): Promise<boolean> {
  const { pool, storeId } = scope;
  const r = await pool.query(
    'DELETE FROM schedule_special_days WHERE store_id = $1 AND date = $2',
    [storeId, data],
  );
  return (r.rowCount ?? 0) > 0;
}
