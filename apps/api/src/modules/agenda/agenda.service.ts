import type {
  AgendaAdminData,
  AgendaConfig,
  SaveAgendaDiaInput,
  UpdateAgendaConfigInput,
} from '@lojao/types/agenda';

import type { StoreScope } from '../../lib/store-scope.js';
import {
  deleteSpecialDay,
  findAgendaConfig,
  findAppointmentCountsInRange,
  findConfirmedAppointmentCount,
  findSpecialDay,
  findSpecialDaysInRange,
  upsertAgendaConfig,
  upsertSpecialDay,
} from './agenda.repository.js';

function parseMes(mes?: string): { mes: string; ano: number; mesNum: number; lastDay: number } {
  const ref = mes ?? new Date().toISOString().slice(0, 7);
  const parts = ref.split('-');
  const ano = Number(parts[0]) || new Date().getFullYear();
  const mesNum = Number(parts[1]) || new Date().getMonth() + 1;
  const lastDay = new Date(ano, mesNum, 0).getDate();
  return { mes: ref, ano, mesNum, lastDay };
}

export async function getAgendaConfig(scope: StoreScope): Promise<AgendaConfig> {
  return findAgendaConfig(scope);
}

export async function getDisponibilidade(scope: StoreScope, data: string) {
  const config = await findAgendaConfig(scope);
  const especial = await findSpecialDay(scope, data);

  let capacidade = config.capacidade_diaria;
  let bloqueado = false;
  let motivo: string | null = null;

  if (especial) {
    motivo = especial.reason;
    if (especial.capacity === null || especial.capacity === 0) {
      bloqueado = true;
    } else {
      capacidade = especial.capacity;
    }
  }

  if (bloqueado) {
    return {
      disponivel: false,
      vagas_total: 0,
      vagas_usadas: 0,
      vagas_livres: 0,
      bloqueado: true,
      motivo,
    };
  }

  const vagas_usadas = await findConfirmedAppointmentCount(scope, data);
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

export async function getAgendaAdmin(
  scope: StoreScope,
  mesParam?: string,
): Promise<AgendaAdminData> {
  const config = await findAgendaConfig(scope);
  const { mes, ano, mesNum, lastDay } = parseMes(mesParam);
  const pad = (n: number) => String(n).padStart(2, '0');
  const inicio = `${mes}-01`;
  const fim = `${mes}-${pad(lastDay)}`;

  const [especiais, agendadosMap] = await Promise.all([
    findSpecialDaysInRange(scope, inicio, fim),
    findAppointmentCountsInRange(scope, inicio, fim),
  ]);

  return { config, mes, ano, mesNum, lastDay, especiais, agendadosMap };
}

export async function updateAgendaConfig(
  scope: StoreScope,
  input: UpdateAgendaConfigInput,
): Promise<AgendaConfig> {
  await upsertAgendaConfig(scope, input);
  return findAgendaConfig(scope);
}

export async function saveAgendaDia(scope: StoreScope, input: SaveAgendaDiaInput): Promise<void> {
  return upsertSpecialDay(scope, input);
}

export async function removeAgendaDia(scope: StoreScope, data: string): Promise<boolean> {
  return deleteSpecialDay(scope, data);
}
