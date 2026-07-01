import type {
  AgendaAdminData,
  AgendaConfig,
  SaveAgendaDiaInput,
  UpdateAgendaConfigInput,
} from '@lojao/types/agenda';
import type pg from 'pg';

import {
  countAgendamentosByDateInRange,
  countAgendamentosConfirmados,
  deleteAgendaDiaEspecial,
  findAgendaConfig,
  findAgendaDiaEspecial,
  findAgendaDiasEspeciaisInRange,
  upsertAgendaConfig,
  upsertAgendaDiaEspecial,
} from './agenda.repository.js';

export async function getAgendaConfig(db: pg.Pool): Promise<AgendaConfig> {
  return findAgendaConfig(db);
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
  const e = await findAgendaDiaEspecial(db, data);

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

  const vagas_usadas = await countAgendamentosConfirmados(db, data);
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

  const [especiais, agendadosMap] = await Promise.all([
    findAgendaDiasEspeciaisInRange(db, inicio, fim),
    countAgendamentosByDateInRange(db, inicio, fim),
  ]);

  return {
    config,
    mes,
    ano,
    mesNum,
    lastDay,
    especiais,
    agendadosMap,
  };
}

/** Porta `agendaController.salvarConfig`. */
export async function updateAgendaConfig(
  db: pg.Pool,
  input: UpdateAgendaConfigInput,
): Promise<AgendaConfig> {
  await upsertAgendaConfig(db, input);
  return getAgendaConfig(db);
}

/** Porta `agendaController.salvarDia`. */
export async function saveAgendaDia(db: pg.Pool, input: SaveAgendaDiaInput): Promise<void> {
  await upsertAgendaDiaEspecial(db, input);
}

/** Porta `agendaController.removerDia`. */
export async function removeAgendaDia(db: pg.Pool, data: string): Promise<boolean> {
  return deleteAgendaDiaEspecial(db, data);
}
