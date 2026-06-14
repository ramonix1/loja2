import { Button, Card, cn } from '@lojao/ui';
import { testIds } from '@lojao/test-utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { ApiError, apiFetch } from '../../../lib/api-client';

interface AgendaConfig {
  capacidade_diaria: number;
  antecedencia_minima_dias: number;
  antecedencia_maxima_dias: number;
}

interface AgendaDiaEspecial {
  data: string;
  capacidade: number | null;
  motivo: string | null;
}

interface AgendaData {
  config: AgendaConfig;
  mes: string;
  ano: number;
  mesNum: number;
  lastDay: number;
  especiais: AgendaDiaEspecial[];
  agendadosMap: Record<string, number>;
}

interface CalendarDay {
  data: string;
  dia: number;
  usados: number;
  capDia: number;
  bloqueado: boolean;
  livres: number;
  isEspecial: boolean;
  motivo: string;
  passado: boolean;
  ehHoje: boolean;
  label: string;
  cellCls: string;
}

const NOMES_MES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function prevMes(mes: string): string {
  const parts = mes.split('-');
  const ano = Number(parts[0]);
  const mesNum = Number(parts[1]);
  if (mesNum === 1) return `${ano - 1}-12`;
  return `${ano}-${pad(mesNum - 1)}`;
}

function nextMes(mes: string): string {
  const parts = mes.split('-');
  const ano = Number(parts[0]);
  const mesNum = Number(parts[1]);
  if (mesNum === 12) return `${ano + 1}-01`;
  return `${ano}-${pad(mesNum + 1)}`;
}

function formatDataLabel(data: string): string {
  const parts = data.split('-');
  const ano = Number(parts[0]);
  const mesNum = Number(parts[1]);
  const dia = Number(parts[2]);
  return `${dia} de ${NOMES_MES[mesNum - 1]} de ${ano}`;
}

function buildCalendar(data: AgendaData): CalendarDay[] {
  const hoje = new Date().toISOString().slice(0, 10);
  const especiaisMap = Object.fromEntries(data.especiais.map((e) => [e.data, e]));
  const days: CalendarDay[] = [];

  for (let dia = 1; dia <= data.lastDay; dia++) {
    const dataStr = `${data.ano}-${pad(data.mesNum)}-${pad(dia)}`;
    const e = especiaisMap[dataStr];
    const usados = data.agendadosMap[dataStr] ?? 0;
    let capDia = data.config.capacidade_diaria;
    let bloqueado = false;
    let motivo = '';
    const isEspecial = Boolean(e);

    if (e) {
      motivo = e.motivo ?? '';
      if (e.capacidade === null || e.capacidade === 0) {
        bloqueado = true;
        capDia = 0;
      } else {
        capDia = e.capacidade;
      }
    }

    const passado = dataStr < hoje;
    const ehHoje = dataStr === hoje;
    const livres = bloqueado ? 0 : Math.max(0, capDia - usados);

    let cellCls: string;
    let label: string;

    if (passado) {
      cellCls = 'bg-gray-800 text-gray-500';
      label = '';
    } else if (bloqueado) {
      cellCls = 'bg-gray-950 border border-gray-700 text-gray-600';
      label = 'Fechado';
    } else if (livres === 0) {
      cellCls = 'bg-red-900/70 text-red-200';
      label = `${usados}/${capDia}`;
    } else if (usados > 0) {
      cellCls = 'bg-yellow-900/60 text-yellow-100';
      label = `${usados}/${capDia}`;
    } else {
      cellCls = 'bg-green-900/60 text-green-100';
      label = `${capDia} vaga${capDia > 1 ? 's' : ''}`;
    }

    if (ehHoje) cellCls += ' ring-2 ring-blue-400';

    days.push({
      data: dataStr,
      dia,
      usados,
      capDia,
      bloqueado,
      livres,
      isEspecial,
      motivo,
      passado,
      ehHoje,
      label,
      cellCls,
    });
  }

  return days;
}

function fetchAgenda(mes: string) {
  return apiFetch<{ data: AgendaData }>(`/api/v1/admin/agenda?mes=${mes}`).then((r) => r.data);
}

export function AgendaPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const mes = searchParams.get('mes') ?? new Date().toISOString().slice(0, 7);

  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [dayCapacidade, setDayCapacidade] = useState('');
  const [dayMotivo, setDayMotivo] = useState('');
  const [configForm, setConfigForm] = useState<AgendaConfig | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(
    null,
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-agenda', mes],
    queryFn: () => fetchAgenda(mes),
  });

  const config = configForm ?? data?.config ?? null;

  const calendarDays = useMemo(() => (data ? buildCalendar(data) : []), [data]);
  const primeiroDiaSemana = data
    ? (new Date(data.ano, data.mesNum - 1, 1).getDay() + 6) % 7
    : 0;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-agenda', mes] });

  const configMutation = useMutation({
    mutationFn: (body: AgendaConfig) =>
      apiFetch('/api/v1/admin/agenda/config', { method: 'PUT', body: JSON.stringify(body) }),
    onSuccess: () => {
      setFeedback({ type: 'success', msg: 'Configurações salvas.' });
      invalidate();
    },
    onError: (err) => {
      setFeedback({
        type: 'error',
        msg: err instanceof ApiError ? err.message : 'Erro ao salvar configurações.',
      });
    },
  });

  const dayMutation = useMutation({
    mutationFn: (body: { data: string; capacidade: number | null; motivo: string | null }) =>
      apiFetch('/api/v1/admin/agenda/dias', { method: 'PUT', body: JSON.stringify(body) }),
    onSuccess: () => {
      setFeedback({ type: 'success', msg: 'Dia especial salvo.' });
      invalidate();
    },
    onError: (err) => {
      setFeedback({
        type: 'error',
        msg: err instanceof ApiError ? err.message : 'Erro ao salvar dia.',
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (dataStr: string) =>
      apiFetch(`/api/v1/admin/agenda/dias/${dataStr}`, { method: 'DELETE' }),
    onSuccess: () => {
      setFeedback({ type: 'success', msg: 'Configuração especial removida.' });
      setSelectedDay(null);
      invalidate();
    },
    onError: (err) => {
      setFeedback({
        type: 'error',
        msg: err instanceof ApiError ? err.message : 'Erro ao remover dia.',
      });
    },
  });

  function openDay(day: CalendarDay) {
    if (day.passado) return;
    setSelectedDay(day);
    if (day.bloqueado) {
      setDayCapacidade('0');
    } else if (day.isEspecial && day.capDia !== data?.config.capacidade_diaria) {
      setDayCapacidade(String(day.capDia));
    } else {
      setDayCapacidade('');
    }
    setDayMotivo(day.motivo);
  }

  function handleConfigSubmit(e: FormEvent) {
    e.preventDefault();
    if (!config) return;
    configMutation.mutate(config);
  }

  function handleDaySubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedDay) return;
    const capacidade =
      dayCapacidade.trim() === '' ? null : Math.max(0, parseInt(dayCapacidade, 10) || 0);
    dayMutation.mutate({
      data: selectedDay.data,
      capacidade,
      motivo: dayMotivo.trim() || null,
    });
  }

  function handleRemoveDay() {
    if (!selectedDay) return;
    if (!window.confirm('Remover configuração especial deste dia?')) return;
    removeMutation.mutate(selectedDay.data);
  }

  if (isLoading) {
    return <p className="text-gray-400">Carregando agenda…</p>;
  }

  if (error || !data || !config) {
    return (
      <p className="text-red-400" data-testid={testIds.adminAgenda.errorMsg}>
        {error instanceof ApiError ? error.message : 'Erro ao carregar agenda.'}
      </p>
    );
  }

  return (
    <div data-testid={testIds.adminAgenda.panel}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Agenda</h1>
        <p className="mt-1 text-sm text-gray-400">Gerencie disponibilidade de datas para eventos</p>
      </div>

      {feedback?.type === 'success' && (
        <div
          className="mb-4 rounded-xl border border-green-700 bg-green-900/50 px-4 py-3 text-sm text-green-300"
          data-testid={testIds.adminAgenda.successMsg}
        >
          {feedback.msg}
        </div>
      )}
      {feedback?.type === 'error' && (
        <div
          className="mb-4 rounded-xl border border-red-700 bg-red-900/50 px-4 py-3 text-sm text-red-300"
          data-testid={testIds.adminAgenda.errorMsg}
        >
          {feedback.msg}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="space-y-4 p-6 xl:col-span-2" data-testid={testIds.adminAgenda.calendar}>
          <div className="mb-5 flex items-center justify-between">
            <Link
              to={`/admin/agenda?mes=${prevMes(mes)}`}
              className="rounded-lg bg-gray-800 px-3 py-1.5 text-sm text-white transition hover:bg-gray-700"
              data-testid={testIds.adminAgenda.calendarPrevBtn}
            >
              ← Anterior
            </Link>
            <h2
              className="text-lg font-bold text-white"
              data-testid={testIds.adminAgenda.calendarMonthLabel}
            >
              {NOMES_MES[data.mesNum - 1]} {data.ano}
            </h2>
            <Link
              to={`/admin/agenda?mes=${nextMes(mes)}`}
              className="rounded-lg bg-gray-800 px-3 py-1.5 text-sm text-white transition hover:bg-gray-700"
              data-testid={testIds.adminAgenda.calendarNextBtn}
            >
              Próximo →
            </Link>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1">
            {DIAS_SEMANA.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: primeiroDiaSemana }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[60px]" />
            ))}
            {calendarDays.map((day) => (
              <button
                key={day.data}
                type="button"
                disabled={day.passado}
                data-testid={testIds.adminAgenda.dayCell(day.data)}
                onClick={() => openDay(day)}
                className={cn(
                  'flex min-h-[60px] flex-col items-center justify-center gap-0.5 rounded-lg transition',
                  day.cellCls,
                  !day.passado && 'cursor-pointer hover:ring-2 hover:ring-white/30',
                  selectedDay?.data === day.data && 'ring-2 ring-white',
                )}
              >
                <span className="text-sm font-semibold">{day.dia}</span>
                {!day.passado && day.label && (
                  <span className="text-xs opacity-80">{day.label}</span>
                )}
              </button>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded bg-green-900/60" /> Disponível
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded bg-yellow-900/60" /> Parcialmente ocupado
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded bg-red-900/70" /> Lotado
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded border border-gray-700 bg-gray-950" /> Fechado
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              Configurações
            </h2>
            <form
              className="space-y-4"
              data-testid={testIds.adminAgenda.configForm}
              onSubmit={handleConfigSubmit}
            >
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">
                  Vagas por dia (padrão)
                </label>
                <input
                  type="number"
                  min={1}
                  value={config.capacidade_diaria}
                  data-testid={testIds.adminAgenda.configCapacidadeInput}
                  onChange={(e) =>
                    setConfigForm({
                      ...config,
                      capacidade_diaria: parseInt(e.target.value, 10) || 1,
                    })
                  }
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">
                  Antecedência mínima (dias)
                </label>
                <input
                  type="number"
                  min={0}
                  value={config.antecedencia_minima_dias}
                  data-testid={testIds.adminAgenda.configAntMinInput}
                  onChange={(e) =>
                    setConfigForm({
                      ...config,
                      antecedencia_minima_dias: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">
                  Antecedência máxima (dias)
                </label>
                <input
                  type="number"
                  min={1}
                  value={config.antecedencia_maxima_dias}
                  data-testid={testIds.adminAgenda.configAntMaxInput}
                  onChange={(e) =>
                    setConfigForm({
                      ...config,
                      antecedencia_maxima_dias: parseInt(e.target.value, 10) || 1,
                    })
                  }
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <Button
                type="submit"
                disabled={configMutation.isPending}
                data-testid={testIds.adminAgenda.configSaveBtn}
                className="w-full"
              >
                Salvar configurações
              </Button>
            </form>
          </Card>

          {selectedDay && (
            <Card
              className="border-blue-700 p-5"
              data-testid={testIds.adminAgenda.dayPanel}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Configurar dia</h3>
                <button
                  type="button"
                  onClick={() => setSelectedDay(null)}
                  className="text-xl leading-none text-gray-500 hover:text-white"
                >
                  ×
                </button>
              </div>
              <div className="mb-4 rounded-lg bg-gray-800 px-3 py-2">
                <p className="text-xs text-gray-400">Data</p>
                <p className="font-semibold text-white">{formatDataLabel(selectedDay.data)}</p>
                <p className="mt-1 text-xs text-gray-400">
                  Agendamentos: {selectedDay.usados} /{' '}
                  {selectedDay.bloqueado ? '0 (fechado)' : selectedDay.capDia}
                </p>
              </div>
              <form className="space-y-3" onSubmit={handleDaySubmit}>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">
                    Capacidade especial
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={dayCapacidade}
                    placeholder="Vazio = padrão | 0 = fechar"
                    data-testid={testIds.adminAgenda.dayCapacidadeInput}
                    onChange={(e) => setDayCapacidade(e.target.value)}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">
                    Motivo (opcional)
                  </label>
                  <input
                    type="text"
                    value={dayMotivo}
                    placeholder="Ex: Feriado, Férias..."
                    data-testid={testIds.adminAgenda.dayMotivoInput}
                    onChange={(e) => setDayMotivo(e.target.value)}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={dayMutation.isPending}
                    data-testid={testIds.adminAgenda.daySaveBtn}
                    className="flex-1"
                  >
                    Salvar
                  </Button>
                  {selectedDay.isEspecial && (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={removeMutation.isPending}
                      data-testid={testIds.adminAgenda.dayRemoveBtn}
                      className="bg-red-900/70 text-red-200 hover:bg-red-800"
                      onClick={handleRemoveDay}
                    >
                      Remover
                    </Button>
                  )}
                </div>
              </form>
            </Card>
          )}

          {data.especiais.length > 0 && (
            <Card className="p-5">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-white">
                Dias especiais do mês
              </h3>
              <div className="space-y-2">
                {data.especiais.map((e) => {
                  const fechado = e.capacidade === null || e.capacidade === 0;
                  return (
                    <div key={e.data} className="flex items-center gap-2 text-sm">
                      <span
                        className={cn(
                          'h-2 w-2 shrink-0 rounded-full',
                          fechado ? 'bg-gray-600' : 'bg-yellow-500',
                        )}
                      />
                      <span className="flex-1 font-mono text-xs text-gray-300">{e.data}</span>
                      <span
                        className={cn(
                          'text-xs',
                          fechado ? 'text-gray-500' : 'text-yellow-300',
                        )}
                      >
                        {fechado
                          ? 'Fechado'
                          : `${e.capacidade} vaga${e.capacidade! > 1 ? 's' : ''}`}
                      </span>
                      {e.motivo && (
                        <span className="max-w-[80px] truncate text-xs text-gray-500" title={e.motivo}>
                          {e.motivo}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
