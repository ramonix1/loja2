import {
  Button,
  adminFieldLabelClass,
  adminInputClass,
  adminMutedClass,
  adminPageSubtitleClass,
  adminPageTitleClass,
  adminPeriodPillClass,
  adminSegmentedControlClass,
} from '@lojao/ui';
import { testIds } from '@lojao/test-utils';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';

import { apiFetch } from '../../../lib/api-client';
import { browserApiBase } from '../../../lib/browser-api';
import { RelatorioTabContent } from './tab-panels';

const RELATORIO_ABAS = [
  'vendas',
  'estoque',
  'entregas',
  'produtos',
  'financeiro',
  'clientes',
  'agendamentos',
] as const;

type RelatorioAba = (typeof RELATORIO_ABAS)[number];

const TENANT_SLUG = import.meta.env.VITE_TENANT_SLUG ?? 'loja';

const TAB_LABELS: Record<RelatorioAba, string> = {
  vendas: 'Vendas',
  estoque: 'Estoque',
  entregas: 'Entregas',
  produtos: 'Produtos',
  financeiro: 'Financeiro',
  clientes: 'Clientes',
  agendamentos: 'Agendamentos',
};

const DATE_TABS = new Set<RelatorioAba>([
  'vendas',
  'produtos',
  'financeiro',
  'clientes',
  'agendamentos',
]);

interface RelatorioResponse {
  data: Record<string, unknown>;
  meta: {
    aba: RelatorioAba;
    dataInicio: string;
    dataFim: string;
    filtroEstoque: string;
  };
}

function fetchRelatorio(params: URLSearchParams) {
  const qs = params.toString();
  return apiFetch<RelatorioResponse>(`/api/v1/admin/relatorios?${qs}`);
}

export function RelatoriosPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const aba = (searchParams.get('aba') as RelatorioAba) || 'vendas';
  const filtroEstoque = searchParams.get('filtro_estoque') ?? 'todos';

  const defaultRange = useMemo(() => {
    const fim = new Date();
    const inicio = new Date(fim);
    inicio.setDate(inicio.getDate() - 29);
    return {
      inicio: inicio.toISOString().slice(0, 10),
      fim: fim.toISOString().slice(0, 10),
    };
  }, []);

  const dataInicio = searchParams.get('inicio') ?? defaultRange.inicio;
  const dataFim = searchParams.get('fim') ?? defaultRange.fim;

  const [inicioInput, setInicioInput] = useState(dataInicio);
  const [fimInput, setFimInput] = useState(dataFim);

  const queryParams = useMemo(() => {
    const p = new URLSearchParams();
    p.set('aba', aba);
    if (DATE_TABS.has(aba)) {
      p.set('inicio', dataInicio);
      p.set('fim', dataFim);
    }
    if (aba === 'estoque') p.set('filtro_estoque', filtroEstoque);
    return p;
  }, [aba, dataInicio, dataFim, filtroEstoque]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'relatorios', queryParams.toString()],
    queryFn: () => fetchRelatorio(queryParams),
  });

  function setAba(novaAba: RelatorioAba) {
    const p = new URLSearchParams(searchParams);
    p.set('aba', novaAba);
    setSearchParams(p);
  }

  function handleDateFilter(e: FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams(searchParams);
    p.set('aba', aba);
    p.set('inicio', inicioInput);
    p.set('fim', fimInput);
    setSearchParams(p);
  }

  function setFiltroEstoque(filtro: string) {
    const p = new URLSearchParams(searchParams);
    p.set('aba', 'estoque');
    p.set('filtro_estoque', filtro);
    setSearchParams(p);
  }

  async function handleExportCsv() {
    const qs = new URLSearchParams();
    if (DATE_TABS.has(aba)) {
      qs.set('inicio', dataInicio);
      qs.set('fim', dataFim);
    }
    const res = await fetch(
      `${browserApiBase()}/api/v1/admin/relatorios/csv/${aba}?${qs.toString()}`,
      {
        credentials: 'include',
        headers: { 'X-Tenant-Slug': TENANT_SLUG },
      },
    );
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${aba}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const dados = data?.data ?? {};

  return (
    <div data-testid={testIds.adminRelatorios.panel}>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={adminPageTitleClass()}>Relatórios</h1>
          <p className={adminPageSubtitleClass('mt-1')}>Visão analítica do negócio</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" type="button" onClick={() => window.print()}>
            Imprimir
          </Button>
          <Button
            type="button"
            data-testid={testIds.adminRelatorios.csvExportBtn}
            onClick={() => void handleExportCsv()}
          >
            Exportar CSV
          </Button>
        </div>
      </div>

      {DATE_TABS.has(aba) && (
        <form
          data-testid={testIds.adminRelatorios.dateFilter}
          onSubmit={handleDateFilter}
          className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-5 py-4"
        >
          <div>
            <label className={adminFieldLabelClass('text-xs')}>Início</label>
            <input
              type="date"
              value={inicioInput}
              onChange={(e) => setInicioInput(e.target.value)}
              data-testid={testIds.adminRelatorios.dateInicioInput}
              className={adminInputClass('w-auto')}
            />
          </div>
          <div>
            <label className={adminFieldLabelClass('text-xs')}>Fim</label>
            <input
              type="date"
              value={fimInput}
              onChange={(e) => setFimInput(e.target.value)}
              data-testid={testIds.adminRelatorios.dateFimInput}
              className={adminInputClass('w-auto')}
            />
          </div>
          <Button type="submit" data-testid={testIds.adminRelatorios.dateFilterBtn}>
            Filtrar
          </Button>
        </form>
      )}

      <div
        data-testid={testIds.adminRelatorios.tabs}
        className={adminSegmentedControlClass('mb-6 w-fit flex-wrap rounded-xl p-1')}
      >
        {RELATORIO_ABAS.map((id) => (
          <button
            key={id}
            type="button"
            data-testid={testIds.adminRelatorios.tab(id)}
            onClick={() => setAba(id)}
            className={adminPeriodPillClass(aba === id, 'rounded-lg px-4 py-2 text-sm')}
          >
            {TAB_LABELS[id]}
          </button>
        ))}
      </div>

      {aba === 'estoque' && (
        <div className="mb-4 flex flex-wrap gap-2">
          {(['todos', 'esgotado', 'baixo', 'ok', 'ilimitado'] as const).map((f) => (
            <button
              key={f}
              type="button"
              data-testid={testIds.adminRelatorios.estoqueFilter(f)}
              onClick={() => setFiltroEstoque(f)}
              className={adminPeriodPillClass(filtroEstoque === f, 'rounded-lg px-3 py-1.5 text-xs')}
            >
              {f === 'todos' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <p className={adminMutedClass()}>Carregando relatório…</p>
      ) : (
        <RelatorioTabContent aba={aba} dados={dados} />
      )}
    </div>
  );
}
