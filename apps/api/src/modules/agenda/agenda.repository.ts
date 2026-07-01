import type { AgendaConfig, SaveAgendaDiaInput, UpdateAgendaConfigInput } from '@lojao/types/agenda';
import type pg from 'pg';

export async function findAgendaConfig(db: pg.Pool): Promise<AgendaConfig> {
  const r = await db.query('SELECT * FROM agenda_config WHERE id = 1');
  const row = r.rows[0];
  return {
    capacidade_diaria: Number(row?.capacidade_diaria ?? 1),
    antecedencia_minima_dias: Number(row?.antecedencia_minima_dias ?? 1),
    antecedencia_maxima_dias: Number(row?.antecedencia_maxima_dias ?? 180),
  };
}

export async function findAgendaDiaEspecial(
  db: pg.Pool,
  data: string,
): Promise<{ capacidade: number | null; motivo: string | null } | null> {
  const r = await db.query('SELECT * FROM agenda_dias_especiais WHERE data = $1', [data]);
  const row = r.rows[0] as { capacidade: number | null; motivo: string | null } | undefined;
  return row ?? null;
}

export async function countAgendamentosConfirmados(db: pg.Pool, data: string): Promise<number> {
  const r = await db.query(
    "SELECT COUNT(*) FROM agendamentos WHERE data_evento = $1 AND status = 'confirmado'",
    [data],
  );
  return parseInt(String(r.rows[0]?.count ?? 0), 10);
}

export async function findAgendaDiasEspeciaisInRange(
  db: pg.Pool,
  inicio: string,
  fim: string,
): Promise<Array<{ data: string; capacidade: number | null; motivo: string | null }>> {
  const r = await db.query(
    `SELECT data::text AS data, capacidade, motivo
     FROM agenda_dias_especiais
     WHERE data BETWEEN $1 AND $2
     ORDER BY data`,
    [inicio, fim],
  );
  return r.rows.map((e) => ({
    data: String(e.data).slice(0, 10),
    capacidade: e.capacidade === null ? null : Number(e.capacidade),
    motivo: (e.motivo as string | null) ?? null,
  }));
}

export async function countAgendamentosByDateInRange(
  db: pg.Pool,
  inicio: string,
  fim: string,
): Promise<Record<string, number>> {
  const r = await db.query(
    `SELECT data_evento::text AS data, COUNT(*)::int AS count
     FROM agendamentos
     WHERE data_evento BETWEEN $1 AND $2 AND status = 'confirmado'
     GROUP BY data_evento`,
    [inicio, fim],
  );

  const agendadosMap: Record<string, number> = {};
  for (const row of r.rows as { data: string; count: number }[]) {
    agendadosMap[row.data] = Number(row.count);
  }
  return agendadosMap;
}

export async function upsertAgendaConfig(
  db: pg.Pool,
  input: UpdateAgendaConfigInput,
): Promise<void> {
  await db.query(
    `INSERT INTO agenda_config (id, capacidade_diaria, antecedencia_minima_dias, antecedencia_maxima_dias, updated_at)
     VALUES (1, $1, $2, $3, NOW())
     ON CONFLICT (id) DO UPDATE SET
       capacidade_diaria = $1,
       antecedencia_minima_dias = $2,
       antecedencia_maxima_dias = $3,
       updated_at = NOW()`,
    [input.capacidade_diaria, input.antecedencia_minima_dias, input.antecedencia_maxima_dias],
  );
}

export async function upsertAgendaDiaEspecial(
  db: pg.Pool,
  input: SaveAgendaDiaInput,
): Promise<void> {
  const cap =
    input.capacidade === undefined || input.capacidade === null ? null : Number(input.capacidade);
  await db.query(
    `INSERT INTO agenda_dias_especiais (data, capacidade, motivo)
     VALUES ($1, $2, $3)
     ON CONFLICT (data) DO UPDATE SET capacidade = $2, motivo = $3`,
    [input.data, cap, input.motivo ?? null],
  );
}

export async function deleteAgendaDiaEspecial(db: pg.Pool, data: string): Promise<boolean> {
  const r = await db.query('DELETE FROM agenda_dias_especiais WHERE data = $1', [data]);
  return (r.rowCount ?? 0) > 0;
}
