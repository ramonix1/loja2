import { Card, Table, cn } from '@lojao/ui';
import { testIds } from '@lojao/test-utils';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { formatBRL } from '../../../lib/currency';

const STATUS_LABEL: Record<string, string> = {
  aguardando_pagamento: 'Aguardando pagamento',
  pago: 'Pago',
  em_separacao: 'Em separação',
  enviado: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

const STATUS_STYLES: Record<string, string> = {
  pago: 'bg-green-900/40 text-green-400',
  enviado: 'bg-blue-900/40 text-blue-400',
  entregue: 'bg-teal-900/40 text-teal-400',
  cancelado: 'bg-red-900/40 text-red-400',
  aguardando_pagamento: 'bg-yellow-900/40 text-yellow-400',
  em_separacao: 'bg-purple-900/40 text-purple-400',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-xs font-medium',
        STATUS_STYLES[status] ?? 'bg-gray-800 text-gray-400',
      )}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function KpiGrid({ children }: { children: ReactNode }) {
  return <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">{children}</div>;
}

function Kpi({ label, value, className }: { label: string; value: ReactNode; className?: string }) {
  return (
    <Card>
      <div className="text-xs text-gray-500">{label}</div>
      <div className={cn('mt-1 text-2xl font-bold text-white', className)}>{value}</div>
    </Card>
  );
}

export function RelatorioTabContent({ aba, dados }: { aba: string; dados: Record<string, unknown> }) {
  if (dados.erro) {
    return (
      <p
        data-testid={testIds.adminRelatorios.errorMsg}
        className="rounded-xl border border-red-700 bg-red-900/30 px-4 py-3 text-sm text-red-300"
      >
        Erro ao carregar relatório: {String(dados.erro)}
      </p>
    );
  }

  if (aba === 'vendas') {
    const resumo = dados.resumo as {
      total_pedidos: number;
      receita_confirmada: number;
      ticket_medio: number;
      receita_pendente: number;
    };
    const pedidos = (dados.pedidos as Array<Record<string, unknown>>) ?? [];
    return (
      <>
        <KpiGrid>
          <Kpi label="Total de pedidos" value={resumo.total_pedidos} />
          <Kpi label="Receita confirmada" value={formatBRL(resumo.receita_confirmada)} className="text-green-400" />
          <Kpi label="Ticket médio" value={formatBRL(resumo.ticket_medio)} className="text-blue-400" />
          <Kpi label="Pendente de pagamento" value={formatBRL(resumo.receita_pendente)} className="text-yellow-400" />
        </KpiGrid>
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-white">Pedidos no período</h3>
          {pedidos.length === 0 ? (
            <p data-testid={testIds.adminRelatorios.emptyState} className="py-8 text-center text-sm text-gray-500">
              Nenhum pedido no período selecionado.
            </p>
          ) : (
            <Table data-testid={testIds.adminRelatorios.table}>
              <thead>
                <tr className="border-b border-gray-800 text-xs uppercase text-gray-500">
                  <th className="px-4 py-2 text-left">#</th>
                  <th className="px-4 py-2 text-left">Data</th>
                  <th className="px-4 py-2 text-left">Cliente</th>
                  <th className="px-4 py-2 text-right">Total</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((p) => (
                  <tr key={String(p.id)} className="border-b border-gray-800 last:border-0">
                    <td className="px-4 py-2 text-gray-500">#{String(p.id)}</td>
                    <td className="px-4 py-2 text-gray-300">
                      {new Date(String(p.created_at)).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-2">
                      <div className="text-white">{String(p.cliente_nome)}</div>
                      <div className="text-xs text-gray-500">{String(p.email_entrega ?? '')}</div>
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-green-400">
                      {formatBRL(Number(p.total))}
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge status={String(p.status)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </>
    );
  }

  if (aba === 'estoque') {
    const resumo = dados.resumo as Record<string, number>;
    const produtos = (dados.produtos as Array<Record<string, unknown>>) ?? [];
    return (
      <>
        <KpiGrid>
          <Kpi label="Total" value={resumo.total} />
          <Kpi label="OK" value={resumo.ok} className="text-green-400" />
          <Kpi label="Estoque baixo" value={resumo.baixo} className="text-yellow-400" />
          <Kpi label="Esgotados" value={resumo.esgotados} className="text-red-400" />
        </KpiGrid>
        <Card>
          {produtos.length === 0 ? (
            <p data-testid={testIds.adminRelatorios.emptyState} className="py-8 text-center text-sm text-gray-500">
              Nenhum produto encontrado.
            </p>
          ) : (
            <Table data-testid={testIds.adminRelatorios.table}>
              <thead>
                <tr className="border-b border-gray-800 text-xs uppercase text-gray-500">
                  <th className="px-4 py-2 text-left">Produto</th>
                  <th className="px-4 py-2 text-left">Categoria</th>
                  <th className="px-4 py-2 text-right">Estoque</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map((p) => (
                  <tr key={String(p.id)} className="border-b border-gray-800 last:border-0">
                    <td className="px-4 py-2 text-white">{String(p.nome)}</td>
                    <td className="px-4 py-2 text-gray-400">{String(p.categoria_nome ?? '—')}</td>
                    <td className="px-4 py-2 text-right">
                      {p.estoque === null ? '∞' : String(p.estoque)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </>
    );
  }

  if (aba === 'entregas') {
    const pedidos = (dados.pedidos as Array<Record<string, unknown>>) ?? [];
    return (
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-white">Pedidos em andamento</h3>
        {pedidos.length === 0 ? (
          <p data-testid={testIds.adminRelatorios.emptyState} className="py-8 text-center text-sm text-gray-500">
            Nenhum pedido em andamento.
          </p>
        ) : (
          <Table data-testid={testIds.adminRelatorios.table}>
            <thead>
              <tr className="border-b border-gray-800 text-xs uppercase text-gray-500">
                <th className="px-4 py-2 text-left">#</th>
                <th className="px-4 py-2 text-left">Destinatário</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => (
                <tr key={String(p.id)} className="border-b border-gray-800 last:border-0">
                  <td className="px-4 py-2">
                    <Link to={`/admin/pedidos/${String(p.id)}`} className="text-blue-400 hover:underline">
                      #{String(p.id)}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-white">{String(p.nome_entrega)}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={String(p.status)} />
                  </td>
                  <td className="px-4 py-2 text-right text-green-400">{formatBRL(Number(p.total))}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    );
  }

  if (aba === 'produtos') {
    const top = (dados.topProdutos as Array<Record<string, unknown>>) ?? [];
    return (
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-white">Top produtos vendidos</h3>
        {top.length === 0 ? (
          <p data-testid={testIds.adminRelatorios.emptyState} className="py-8 text-center text-sm text-gray-500">
            Nenhum produto vendido no período.
          </p>
        ) : (
          <div data-testid={testIds.adminRelatorios.table} className="space-y-3">
            {top.map((p, i) => (
              <div key={String(p.nome_produto)} className="flex justify-between text-sm">
                <span className="text-gray-300">
                  {i + 1}. {String(p.nome_produto)}
                </span>
                <span className="text-green-400">{formatBRL(Number(p.receita_total))}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    );
  }

  if (aba === 'financeiro') {
    const resumo = dados.resumo as {
      receita_total: number;
      total_pedidos: number;
      ticket_medio: number;
      total_frete: number;
    };
    const porMetodo = (dados.porMetodo as Array<Record<string, unknown>>) ?? [];
    return (
      <>
        <KpiGrid>
          <Kpi label="Receita total" value={formatBRL(resumo.receita_total)} className="text-green-400" />
          <Kpi label="Total pedidos" value={resumo.total_pedidos} />
          <Kpi label="Ticket médio" value={formatBRL(resumo.ticket_medio)} className="text-blue-400" />
          <Kpi label="Total em frete" value={formatBRL(resumo.total_frete)} />
        </KpiGrid>
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-white">Métodos de pagamento</h3>
          {porMetodo.length === 0 ? (
            <p data-testid={testIds.adminRelatorios.emptyState} className="text-sm text-gray-500">
              Nenhum dado.
            </p>
          ) : (
            <div data-testid={testIds.adminRelatorios.table} className="space-y-2">
              {porMetodo.map((m) => (
                <div key={String(m.metodo_pagamento)} className="flex justify-between text-sm">
                  <span className="capitalize text-gray-300">{String(m.metodo_pagamento)}</span>
                  <span className="text-green-400">{formatBRL(Number(m.receita))}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </>
    );
  }

  if (aba === 'clientes') {
    const top = (dados.topClientes as Array<Record<string, unknown>>) ?? [];
    const totalClientes = Number(dados.totalClientes ?? 0);
    return (
      <>
        <KpiGrid>
          <Kpi label="Total de clientes" value={totalClientes} />
          <Kpi label="Ativos no período" value={top.length} className="text-blue-400" />
        </KpiGrid>
        <Card>
          {top.length === 0 ? (
            <p data-testid={testIds.adminRelatorios.emptyState} className="py-8 text-center text-sm text-gray-500">
              Nenhum cliente com pedidos no período.
            </p>
          ) : (
            <Table data-testid={testIds.adminRelatorios.table}>
              <thead>
                <tr className="border-b border-gray-800 text-xs uppercase text-gray-500">
                  <th className="px-4 py-2 text-left">Cliente</th>
                  <th className="px-4 py-2 text-right">Pedidos</th>
                  <th className="px-4 py-2 text-right">Total gasto</th>
                </tr>
              </thead>
              <tbody>
                {top.map((c) => (
                  <tr key={String(c.email)} className="border-b border-gray-800 last:border-0">
                    <td className="px-4 py-2">
                      <div className="text-white">{String(c.nome)}</div>
                      <div className="text-xs text-gray-500">{String(c.email)}</div>
                    </td>
                    <td className="px-4 py-2 text-right">{String(c.total_pedidos)}</td>
                    <td className="px-4 py-2 text-right text-green-400">
                      {formatBRL(Number(c.total_gasto))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </>
    );
  }

  if (aba === 'agendamentos') {
    const resumo = dados.resumo as {
      total: number;
      confirmados: number;
      cancelados: number;
      receita_confirmada: number;
    };
    const agendamentos = (dados.agendamentos as Array<Record<string, unknown>>) ?? [];
    return (
      <>
        <KpiGrid>
          <Kpi label="Total no período" value={resumo.total} />
          <Kpi label="Confirmados" value={resumo.confirmados} className="text-green-400" />
          <Kpi label="Cancelados" value={resumo.cancelados} className="text-red-400" />
          <Kpi label="Receita confirmada" value={formatBRL(resumo.receita_confirmada)} className="text-blue-400" />
        </KpiGrid>
        <Card>
          {agendamentos.length === 0 ? (
            <p data-testid={testIds.adminRelatorios.emptyState} className="py-8 text-center text-sm text-gray-500">
              Nenhum agendamento no período.
            </p>
          ) : (
            <Table data-testid={testIds.adminRelatorios.table}>
              <thead>
                <tr className="border-b border-gray-800 text-xs uppercase text-gray-500">
                  <th className="px-4 py-2 text-left">Pedido</th>
                  <th className="px-4 py-2 text-left">Cliente</th>
                  <th className="px-4 py-2 text-left">Data evento</th>
                  <th className="px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {agendamentos.map((a) => (
                  <tr key={String(a.id)} className="border-b border-gray-800 last:border-0">
                    <td className="px-4 py-2 text-blue-400">#{String(a.pedido_id)}</td>
                    <td className="px-4 py-2 text-white">{String(a.cliente_nome)}</td>
                    <td className="px-4 py-2 text-gray-300">
                      {new Date(`${String(a.data_evento)}T12:00:00`).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-2 text-right text-green-400">
                      {formatBRL(Number(a.total))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </>
    );
  }

  return null;
}
