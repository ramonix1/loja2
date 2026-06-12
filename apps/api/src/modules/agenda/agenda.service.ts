import type {
  AgendaAdminData,
  AgendaConfig,
  SaveAgendaDiaInput,
  UpdateAgendaConfigInput,
} from '@lojao/types/agenda';
import type pg from 'pg';

export async function getAgendaConfig(db: pg.Pool): Promise<AgendaConfig> {
  const r = await db.query('SELECT * FROM agenda_config WHERE id = 1');
  const row = r.rows[0];
  return {
    capacidade_diaria: Number(row?.capacidade_diaria ?? 1),
    antecedencia_minima_dias: Number(row?.antecedencia_minima_dias ?? 1),
    antecedencia_maxima_dias: Number(row?.antecedencia_maxima_dias ?? 180),
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
export async function getDisponibilidade(db: pg.Pool, data: string) {
  const config = await getAgendaConfig(db);

  const especial = await db.query('SELECT * FROM agenda_dias_especiais WHERE data = $1', [data]);
  const e = especial.rows[0] as { capacidade: number | null; motivo: string | null } | undefined;

  let capacidade = config.capacidade_diaria;
  let bloqueado = false;
  let motivo: string | null = null;

  if (e) {
    motivo = e.motivo;
    if (e.capacidade === null || e.capacidade === 0) {
      bloqueado = true;
    } else {
      capacidade = e.capacidade;
    }
  }

  if (bloqueado) {
    return { disponivel: false, vagas_total: 0, vagas_usadas: 0, vagas_livres: 0, bloqueado: true, motivo };
  }

  const r = await db.query(
    "SELECT COUNT(*) FROM agendamentos WHERE data_evento = $1 AND status = 'confirmado'",
    [data],
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
export async function getAgendaAdmin(db: pg.Pool, mesParam?: string): Promise<AgendaAdminData> {
  const config = await getAgendaConfig(db);
  const { mes, ano, mesNum, lastDay } = parseMes(mesParam);
  const pad = (n: number) => String(n).padStart(2, '0');
  const inicio = `${mes}-01`;
  const fim = `${mes}-${pad(lastDay)}`;

  const [especiaisRes, agendadosRes] = await Promise.all([
    db.query(
      `SELECT data::text AS data, capacidade, motivo
       FROM agenda_dias_especiais
       WHERE data BETWEEN $1 AND $2
       ORDER BY data`,
      [inicio, fim],
    ),
    db.query(
      `SELECT data_evento::text AS data, COUNT(*)::int AS count
       FROM agendamentos
       WHERE data_evento BETWEEN $1 AND $2 AND status = 'confirmado'
       GROUP BY data_evento`,
      [inicio, fim],
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
      capacidade: e.capacidade === null ? null : Number(e.capacidade),
      motivo: (e.motivo as string | null) ?? null,
    })),
    agendadosMap,
  };
}

/** Porta `agendaController.salvarConfig`. */
export async function updateAgendaConfig(
  db: pg.Pool,
  input: UpdateAgendaConfigInput,
): Promise<AgendaConfig> {
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
  return getAgendaConfig(db);
}

/** Porta `agendaController.salvarDia`. */
export async function saveAgendaDia(db: pg.Pool, input: SaveAgendaDiaInput): Promise<void> {
  const cap =
    input.capacidade === undefined || input.capacidade === null ? null : Number(input.capacidade);
  await db.query(
    `INSERT INTO agenda_dias_especiais (data, capacidade, motivo)
     VALUES ($1, $2, $3)
     ON CONFLICT (data) DO UPDATE SET capacidade = $2, motivo = $3`,
    [input.data, cap, input.motivo ?? null],
  );
}

/** Porta `agendaController.removerDia`. */
export async function removeAgendaDia(db: pg.Pool, data: string): Promise<boolean> {
  const r = await db.query('DELETE FROM agenda_dias_especiais WHERE data = $1', [data]);
  return (r.rowCount ?? 0) > 0;
}
