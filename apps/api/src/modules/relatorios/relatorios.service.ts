import type { FiltroEstoque, RelatorioAba, RelatorioCsvTipo } from '@lojao/types/relatorios';
import { STATUS_LABEL } from '@lojao/types/relatorios';

import type { StoreScope } from '../../lib/store-scope.js';
import {
  fetchDadosAgendamentos,
  fetchDadosClientes,
  fetchDadosEntregas,
  fetchDadosEstoque,
  fetchDadosFinanceiro,
  fetchDadosProdutos,
  fetchDadosVendas,
} from './relatorios.repository.js';

export interface RelatorioDateRange {
  dataInicio: Date;
  dataFim: Date;
  dataInicioStr: string;
  dataFimStr: string;
}

export function parseRelatorioDatas(query: { inicio?: string; fim?: string }): RelatorioDateRange {
  const hoje = new Date();
  const inicio30 = new Date(hoje);
  inicio30.setDate(inicio30.getDate() - 29);

  const dataInicio = query.inicio ? new Date(`${query.inicio}T00:00:00`) : inicio30;
  const dataFim = query.fim
    ? new Date(`${query.fim}T23:59:59`)
    : new Date(new Date().setHours(23, 59, 59, 999));

  return {
    dataInicio,
    dataFim,
    dataInicioStr: dataInicio.toISOString().slice(0, 10),
    dataFimStr: dataFim.toISOString().slice(0, 10),
  };
}

export async function getRelatorioDados(
  scope: StoreScope,
  aba: RelatorioAba,
  range: RelatorioDateRange,
  filtroEstoque: FiltroEstoque,
): Promise<Record<string, unknown>> {
  if (aba === 'vendas') return fetchDadosVendas(scope, range.dataInicio, range.dataFim);
  if (aba === 'estoque') return fetchDadosEstoque(scope, filtroEstoque);
  if (aba === 'entregas') return fetchDadosEntregas(scope);
  if (aba === 'produtos') return fetchDadosProdutos(scope, range.dataInicio, range.dataFim);
  if (aba === 'financeiro') return fetchDadosFinanceiro(scope, range.dataInicio, range.dataFim);
  if (aba === 'clientes') return fetchDadosClientes(scope, range.dataInicio, range.dataFim);
  if (aba === 'agendamentos') return fetchDadosAgendamentos(scope, range.dataInicio, range.dataFim);
  return {};
}

function fmtDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('pt-BR');
}

export async function buildRelatorioCsv(
  scope: StoreScope,
  tipo: RelatorioCsvTipo,
  range: RelatorioDateRange,
): Promise<{ csv: string; filename: string }> {
  let linhas: (string | number | null)[][] = [];
  let filename: string = tipo;

  if (tipo === 'vendas') {
    const d = await fetchDadosVendas(scope, range.dataInicio, range.dataFim);
    const pedidos = d.pedidos as Array<Record<string, unknown>>;
    linhas = [
      ['ID', 'Data', 'Cliente', 'E-mail', 'Itens', 'Subtotal', 'Frete', 'Total', 'Pagamento', 'Status'],
      ...pedidos.map((p) => [
        p.id as number, fmtDate(p.created_at as string), p.cliente_nome as string,
        p.email_entrega as string, p.qtd_itens as number, p.subtotal as number,
        p.frete as number, p.total as number, (p.metodo_pagamento as string) || '',
        STATUS_LABEL[p.status as string] || (p.status as string),
      ]),
    ];
    filename = `vendas_${range.dataInicioStr}_${range.dataFimStr}`;
  } else if (tipo === 'estoque') {
    const d = await fetchDadosEstoque(scope, 'todos');
    const produtos = d.produtos as Array<Record<string, unknown>>;
    linhas = [
      ['Produto', 'Categoria', 'Estoque', 'Status'],
      ...produtos.map((p) => [
        p.nome as string, (p.categoria_nome as string) || '—',
        p.estoque !== null ? (p.estoque as number) : 'Ilimitado',
        p.estoque === null ? 'Sem controle' : (p.estoque as number) === 0 ? 'Esgotado'
          : (p.estoque as number) <= 5 ? 'Estoque baixo' : 'OK',
      ]),
    ];
    filename = 'estoque';
  } else if (tipo === 'entregas') {
    const d = await fetchDadosEntregas(scope);
    const pedidos = d.pedidos as Array<Record<string, unknown>>;
    linhas = [
      ['ID', 'Data', 'Cliente', 'Status', 'Rastreio', 'Cidade/UF', 'Total'],
      ...pedidos.map((p) => [
        p.id as number, fmtDate(p.created_at as string), p.nome_entrega as string,
        STATUS_LABEL[p.status as string] || (p.status as string),
        (p.codigo_rastreio as string) || '—',
        `${p.cidade || ''}/${p.estado || ''}`, p.total as number,
      ]),
    ];
    filename = 'entregas';
  } else if (tipo === 'produtos') {
    const d = await fetchDadosProdutos(scope, range.dataInicio, range.dataFim);
    const top = d.topProdutos as Array<Record<string, unknown>>;
    linhas = [
      ['Produto', 'Qtd Vendida', 'Receita (R$)', 'Pedidos'],
      ...top.map((p) => [
        p.nome_produto as string, p.total_vendido as number,
        p.receita_total as number, p.total_pedidos as number,
      ]),
    ];
    filename = `produtos_${range.dataInicioStr}_${range.dataFimStr}`;
  } else if (tipo === 'financeiro') {
    const d = await fetchDadosFinanceiro(scope, range.dataInicio, range.dataFim);
    const porMetodo = d.porMetodo as Array<Record<string, unknown>>;
    const porDia = d.porDia as Array<Record<string, unknown>>;
    linhas = [
      ['Método de Pagamento', 'Pedidos', 'Receita (R$)'],
      ...porMetodo.map((m) => [
        (m.metodo_pagamento as string) || 'N/A',
        m.total_pedidos as number, m.receita as number,
      ]),
      [],
      ['Data', 'Pedidos', 'Receita (R$)'],
      ...porDia.map((row) => [
        fmtDate(row.dia as string), row.total_pedidos as number, row.receita as number,
      ]),
    ];
    filename = `financeiro_${range.dataInicioStr}_${range.dataFimStr}`;
  } else if (tipo === 'clientes') {
    const d = await fetchDadosClientes(scope, range.dataInicio, range.dataFim);
    const top = d.topClientes as Array<Record<string, unknown>>;
    linhas = [
      ['Cliente', 'E-mail', 'Pedidos', 'Total Gasto (R$)', 'Último Pedido'],
      ...top.map((c) => [
        c.nome as string, c.email as string, c.total_pedidos as number,
        c.total_gasto as number, fmtDate(c.ultimo_pedido as string),
      ]),
    ];
    filename = `clientes_${range.dataInicioStr}_${range.dataFimStr}`;
  } else if (tipo === 'agendamentos') {
    const d = await fetchDadosAgendamentos(scope, range.dataInicio, range.dataFim);
    const agendamentos = d.agendamentos as Array<Record<string, unknown>>;
    linhas = [
      ['Pedido #', 'Cliente', 'E-mail', 'Telefone', 'Data da Compra', 'Data Agendada',
       'Produtos', 'Total (R$)', 'Status Agendamento', 'Status Pedido'],
      ...agendamentos.map((a) => [
        a.pedido_id as number, a.cliente_nome as string, a.email as string,
        (a.telefone as string) || '', fmtDate(a.data_compra as string),
        fmtDate(`${String(a.data_evento).slice(0, 10)}T12:00:00`),
        a.produtos as string, a.total as number,
        a.status_agendamento === 'confirmado' ? 'Confirmado' : 'Cancelado',
        STATUS_LABEL[a.status_pedido as string] || (a.status_pedido as string),
      ]),
    ];
    filename = `agendamentos_${range.dataInicioStr}_${range.dataFimStr}`;
  }

  const BOM = '\uFEFF';
  const csv =
    BOM +
    linhas
      .map((l) => l.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';'))
      .join('\n');

  return { csv, filename };
}
