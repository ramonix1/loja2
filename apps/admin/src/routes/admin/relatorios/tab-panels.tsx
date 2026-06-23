import {
  Card,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  adminEmptyStateClass,
  adminMutedClass,
  adminSectionTitleClass,
  adminStatValueClass,
  adminStatValueSuccessClass,
  StatusBadge,
  adminSubtleClass,
  cn,
} from '@lojao/ui';
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

function RelatorioStatusBadge({ status }: { status: string }) {
  return (
    <StatusBadge status={status}>
      {STATUS_LABEL[status] ?? status}
    </StatusBadge>
  );
}

function KpiGrid({ children }: { children: ReactNode }) {
  return <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">{children}</div>;
}

function Kpi({ label, value, className }: { label: string; value: ReactNode; className?: string }) {
  return (
    <Card surface="admin">
      <div className={cn('text-xs', adminSubtleClass())}>{label}</div>
      <div className={cn(adminStatValueClass('mt-1 text-2xl'), className)}>{value}</div>
    </Card>
  );
}

export function RelatorioTabContent({ aba, dados }: { aba: string; dados: Record<string, unknown> }) {
  if (dados.erro) {
    return (
      <p data-testid={testIds.adminRelatorios.errorMsg} className="ds-alert-error text-sm">
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
          <Kpi label="Receita confirmada" value={formatBRL(resumo.receita_confirmada)} className={adminStatValueSuccessClass('text-2xl')} />
          <Kpi label="Ticket médio" value={formatBRL(resumo.ticket_medio)} className="text-[var(--admin-accent)]" />
          <Kpi label="Pendente de pagamento" value={formatBRL(resumo.receita_pendente)} className="text-[var(--admin-warning-text)]" />
        </KpiGrid>
        <Card surface="admin">
          <h3 className={adminSectionTitleClass('mb-4 text-sm')}>Pedidos no período</h3>
          {pedidos.length === 0 ? (
            <p data-testid={testIds.adminRelatorios.emptyState} className={adminEmptyStateClass('py-8 text-sm')}>
              Nenhum pedido no período selecionado.
            </p>
          ) : (
            <Table surface="admin" data-testid={testIds.adminRelatorios.table}>
              <TableHead surface="admin">
                <TableRow surface="admin">
                  <TableHeaderCell>#</TableHeaderCell>
                  <TableHeaderCell>Data</TableHeaderCell>
                  <TableHeaderCell>Cliente</TableHeaderCell>
                  <TableHeaderCell className="text-right">Total</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                </TableRow>
              </TableHead>
              <tbody>
                {pedidos.map((p) => (
                  <TableRow key={String(p.id)} surface="admin">
                    <TableCell className={adminSubtleClass()}>#{String(p.id)}</TableCell>
                    <TableCell>
                      {new Date(String(p.created_at)).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="text-[var(--admin-text)]">{String(p.cliente_nome)}</div>
                      <div className={cn('text-xs', adminSubtleClass())}>{String(p.email_entrega ?? '')}</div>
                    </TableCell>
                    <TableCell className={cn('text-right font-semibold', adminStatValueSuccessClass('text-base'))}>
                      {formatBRL(Number(p.total))}
                    </TableCell>
                    <TableCell>
                      <RelatorioStatusBadge status={String(p.status)} />
                    </TableCell>
                  </TableRow>
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
          <Kpi label="OK" value={resumo.ok} className={adminStatValueSuccessClass('text-2xl')} />
          <Kpi label="Estoque baixo" value={resumo.baixo} className="text-[var(--admin-warning-text)]" />
          <Kpi label="Esgotados" value={resumo.esgotados} className="text-[var(--admin-error-text)]" />
        </KpiGrid>
        <Card surface="admin">
          {produtos.length === 0 ? (
            <p data-testid={testIds.adminRelatorios.emptyState} className={adminEmptyStateClass('py-8 text-sm')}>
              Nenhum produto encontrado.
            </p>
          ) : (
            <Table surface="admin" data-testid={testIds.adminRelatorios.table}>
              <TableHead surface="admin">
                <TableRow surface="admin">
                  <TableHeaderCell>Produto</TableHeaderCell>
                  <TableHeaderCell>Categoria</TableHeaderCell>
                  <TableHeaderCell className="text-right">Estoque</TableHeaderCell>
                </TableRow>
              </TableHead>
              <tbody>
                {produtos.map((p) => (
                  <TableRow key={String(p.id)} surface="admin">
                    <TableCell>{String(p.nome)}</TableCell>
                    <TableCell className={adminMutedClass()}>{String(p.categoria_nome ?? '—')}</TableCell>
                    <TableCell className="text-right">
                      {p.estoque === null ? '∞' : String(p.estoque)}
                    </TableCell>
                  </TableRow>
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
      <Card surface="admin">
        <h3 className={adminSectionTitleClass('mb-4 text-sm')}>Pedidos em andamento</h3>
        {pedidos.length === 0 ? (
          <p data-testid={testIds.adminRelatorios.emptyState} className={adminEmptyStateClass('py-8 text-sm')}>
            Nenhum pedido em andamento.
          </p>
        ) : (
          <Table surface="admin" data-testid={testIds.adminRelatorios.table}>
            <TableHead surface="admin">
              <TableRow surface="admin">
                <TableHeaderCell>#</TableHeaderCell>
                <TableHeaderCell>Destinatário</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell className="text-right">Total</TableHeaderCell>
              </TableRow>
            </TableHead>
            <tbody>
              {pedidos.map((p) => (
                <TableRow key={String(p.id)} surface="admin">
                  <TableCell>
                    <Link to={`/admin/pedidos/${String(p.id)}`} className="ds-link">
                      #{String(p.id)}
                    </Link>
                  </TableCell>
                  <TableCell>{String(p.nome_entrega)}</TableCell>
                  <TableCell>
                    <RelatorioStatusBadge status={String(p.status)} />
                  </TableCell>
                  <TableCell className={cn('text-right', adminStatValueSuccessClass('text-base'))}>
                    {formatBRL(Number(p.total))}
                  </TableCell>
                </TableRow>
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
      <Card surface="admin">
        <h3 className={adminSectionTitleClass('mb-4 text-sm')}>Top produtos vendidos</h3>
        {top.length === 0 ? (
          <p data-testid={testIds.adminRelatorios.emptyState} className={adminEmptyStateClass('py-8 text-sm')}>
            Nenhum produto vendido no período.
          </p>
        ) : (
          <div data-testid={testIds.adminRelatorios.table} className="space-y-3">
            {top.map((p, i) => (
              <div key={String(p.nome_produto)} className="flex justify-between text-sm">
                <span className={adminMutedClass()}>
                  {i + 1}. {String(p.nome_produto)}
                </span>
                <span className={adminStatValueSuccessClass('text-base')}>{formatBRL(Number(p.receita_total))}</span>
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
          <Kpi label="Receita total" value={formatBRL(resumo.receita_total)} className={adminStatValueSuccessClass('text-2xl')} />
          <Kpi label="Total pedidos" value={resumo.total_pedidos} />
          <Kpi label="Ticket médio" value={formatBRL(resumo.ticket_medio)} className="text-[var(--admin-accent)]" />
          <Kpi label="Total em frete" value={formatBRL(resumo.total_frete)} />
        </KpiGrid>
        <Card surface="admin">
          <h3 className={adminSectionTitleClass('mb-4 text-sm')}>Métodos de pagamento</h3>
          {porMetodo.length === 0 ? (
            <p data-testid={testIds.adminRelatorios.emptyState} className={cn('text-sm', adminSubtleClass())}>
              Nenhum dado.
            </p>
          ) : (
            <div data-testid={testIds.adminRelatorios.table} className="space-y-2">
              {porMetodo.map((m) => (
                <div key={String(m.metodo_pagamento)} className="flex justify-between text-sm">
                  <span className={cn('capitalize', adminMutedClass())}>{String(m.metodo_pagamento)}</span>
                  <span className={adminStatValueSuccessClass('text-base')}>{formatBRL(Number(m.receita))}</span>
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
          <Kpi label="Ativos no período" value={top.length} className="text-[var(--admin-accent)]" />
        </KpiGrid>
        <Card surface="admin">
          {top.length === 0 ? (
            <p data-testid={testIds.adminRelatorios.emptyState} className={adminEmptyStateClass('py-8 text-sm')}>
              Nenhum cliente com pedidos no período.
            </p>
          ) : (
            <Table surface="admin" data-testid={testIds.adminRelatorios.table}>
              <TableHead surface="admin">
                <TableRow surface="admin">
                  <TableHeaderCell>Cliente</TableHeaderCell>
                  <TableHeaderCell className="text-right">Pedidos</TableHeaderCell>
                  <TableHeaderCell className="text-right">Total gasto</TableHeaderCell>
                </TableRow>
              </TableHead>
              <tbody>
                {top.map((c) => (
                  <TableRow key={String(c.email)} surface="admin">
                    <TableCell>
                      <div className="text-[var(--admin-text)]">{String(c.nome)}</div>
                      <div className={cn('text-xs', adminSubtleClass())}>{String(c.email)}</div>
                    </TableCell>
                    <TableCell className="text-right">{String(c.total_pedidos)}</TableCell>
                    <TableCell className={cn('text-right', adminStatValueSuccessClass('text-base'))}>
                      {formatBRL(Number(c.total_gasto))}
                    </TableCell>
                  </TableRow>
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
          <Kpi label="Confirmados" value={resumo.confirmados} className={adminStatValueSuccessClass('text-2xl')} />
          <Kpi label="Cancelados" value={resumo.cancelados} className="text-[var(--admin-error-text)]" />
          <Kpi label="Receita confirmada" value={formatBRL(resumo.receita_confirmada)} className="text-[var(--admin-accent)]" />
        </KpiGrid>
        <Card surface="admin">
          {agendamentos.length === 0 ? (
            <p data-testid={testIds.adminRelatorios.emptyState} className={adminEmptyStateClass('py-8 text-sm')}>
              Nenhum agendamento no período.
            </p>
          ) : (
            <Table surface="admin" data-testid={testIds.adminRelatorios.table}>
              <TableHead surface="admin">
                <TableRow surface="admin">
                  <TableHeaderCell>Pedido</TableHeaderCell>
                  <TableHeaderCell>Cliente</TableHeaderCell>
                  <TableHeaderCell>Data evento</TableHeaderCell>
                  <TableHeaderCell className="text-right">Total</TableHeaderCell>
                </TableRow>
              </TableHead>
              <tbody>
                {agendamentos.map((a) => (
                  <TableRow key={String(a.id)} surface="admin">
                    <TableCell className="ds-link">#{String(a.pedido_id)}</TableCell>
                    <TableCell>{String(a.cliente_nome)}</TableCell>
                    <TableCell className={adminMutedClass()}>
                      {new Date(`${String(a.data_evento)}T12:00:00`).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className={cn('text-right', adminStatValueSuccessClass('text-base'))}>
                      {formatBRL(Number(a.total))}
                    </TableCell>
                  </TableRow>
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
