import {
  Button,
  Card,
  adminMutedClass,
  adminPageSubtitleClass,
  adminPageTitleClass,
  adminSectionTitleClass,
  adminStatValueClass,
  adminStatValueSuccessClass,
  StatusBadge,
  adminSubtleClass,
  cn,
} from '@lojao/ui';
import { testIds } from '@lojao/test-utils';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';

import { apiFetch } from '../../../lib/api-client';
import { formatBRL } from '../../../lib/currency';

interface CompradorDetailData {
  comprador: {
    id: number;
    nome: string;
    email: string;
    telefone: string | null;
    cpf: string | null;
    cep: string | null;
    logradouro: string | null;
    numero: string | null;
    complemento: string | null;
    bairro: string | null;
    cidade: string | null;
    estado: string | null;
    ativo: boolean;
    created_at: string;
    ultimo_acesso: string | null;
  };
  pedidos: Array<{
    id: number;
    status: string;
    total: number;
    frete: number;
    created_at: string;
    itens: Array<{
      nome: string;
      quantidade: number;
      subtotal: number;
    }>;
  }>;
  agendamentos: Array<{
    id: number;
    pedido_id: number;
    data_evento: string;
    status: string;
    pedido_total: number;
  }>;
  resumo: {
    total_pedidos: number;
    total_gasto: number;
  };
}

const STATUS_LABEL: Record<string, string> = {
  aguardando_pagamento: 'Aguardando pagamento',
  pago: 'Pago',
  em_separacao: 'Em separação',
  enviado: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

function fetchComprador(id: string) {
  return apiFetch<{ data: CompradorDetailData }>(`/api/v1/admin/compradores/${id}`).then(
    (r) => r.data,
  );
}

export function CompradorDetailPage() {
  const { id = '' } = useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'compradores', id],
    queryFn: () => fetchComprador(id),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <Card surface="admin" className={cn('text-center', adminMutedClass())}>
        Carregando ficha…
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <div>
        <p className="ds-alert-error mb-4">Comprador não encontrado.</p>
        <Link to="/admin/compradores">
          <Button variant="secondary" data-testid={testIds.adminCompradores.detailBackBtn}>
            Voltar
          </Button>
        </Link>
      </div>
    );
  }

  const { comprador, pedidos, agendamentos, resumo } = data;
  const temEndereco = Boolean(comprador.logradouro || comprador.cidade);

  return (
    <div data-testid={testIds.adminCompradores.detailPanel}>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--admin-accent)] text-2xl font-bold text-[var(--admin-text)]">
            {comprador.nome.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className={adminPageTitleClass()}>{comprador.nome}</h1>
            <div className="mt-1 flex items-center gap-3">
              <span className={adminPageSubtitleClass()}>{comprador.email}</span>
              <StatusBadge status={comprador.ativo ? 'pago' : 'cancelado'}>
                {comprador.ativo ? 'Ativo' : 'Inativo'}
              </StatusBadge>
            </div>
          </div>
        </div>
        <Link to="/admin/compradores">
          <Button variant="secondary" data-testid={testIds.adminCompradores.detailBackBtn}>
            Voltar
          </Button>
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card surface="admin">
          <div className={cn('text-xs', adminSubtleClass())}>Total de pedidos</div>
          <div className={adminStatValueClass('text-2xl')}>{resumo.total_pedidos}</div>
        </Card>
        <Card surface="admin">
          <div className={cn('text-xs', adminSubtleClass())}>Total gasto</div>
          <div className={adminStatValueSuccessClass('text-2xl')}>
            {formatBRL(resumo.total_gasto)}
          </div>
        </Card>
        <Card surface="admin">
          <div className={cn('text-xs', adminSubtleClass())}>Agendamentos</div>
          <div className={cn(adminStatValueClass('text-2xl'), 'text-[var(--admin-accent)]')}>
            {agendamentos.length}
          </div>
        </Card>
        <Card surface="admin">
          <div className={cn('text-xs', adminSubtleClass())}>Cliente desde</div>
          <div className={adminStatValueClass('text-lg')}>
            {new Date(comprador.created_at).toLocaleDateString('pt-BR')}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4">
          <Card surface="admin">
            <h2 className={adminSectionTitleClass('mb-4')}>Dados pessoais</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className={adminSubtleClass()}>Nome completo</dt>
                <dd className="text-[var(--admin-text-muted)]">{comprador.nome}</dd>
              </div>
              <div>
                <dt className={adminSubtleClass()}>E-mail</dt>
                <dd className="text-[var(--admin-text-muted)]">{comprador.email}</dd>
              </div>
              <div>
                <dt className={adminSubtleClass()}>Telefone</dt>
                <dd className="text-[var(--admin-text-muted)]">{comprador.telefone ?? '—'}</dd>
              </div>
              <div>
                <dt className={adminSubtleClass()}>CPF</dt>
                <dd className="text-[var(--admin-text-muted)]">{comprador.cpf ?? '—'}</dd>
              </div>
            </dl>
          </Card>

          <Card surface="admin">
            <h2 className={adminSectionTitleClass('mb-4')}>Endereço</h2>
            {temEndereco ? (
              <div className="space-y-2 text-sm text-[var(--admin-text-muted)]">
                {comprador.logradouro && (
                  <p>
                    {comprador.logradouro}, {comprador.numero}
                    {comprador.complemento ? ` — ${comprador.complemento}` : ''}
                  </p>
                )}
                {comprador.bairro && <p className={adminMutedClass()}>{comprador.bairro}</p>}
                {comprador.cidade && (
                  <p>
                    {comprador.cidade} / {comprador.estado}
                  </p>
                )}
                {comprador.cep && <p className={adminSubtleClass()}>CEP: {comprador.cep}</p>}
              </div>
            ) : (
              <p className={cn('text-sm', adminSubtleClass())}>Endereço não informado</p>
            )}
          </Card>

          <Card surface="admin">
            <h2 className={adminSectionTitleClass('mb-4')}>Conta</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className={adminSubtleClass()}>Cadastro</dt>
                <dd className="text-[var(--admin-text-muted)]">
                  {new Date(comprador.created_at).toLocaleDateString('pt-BR')} às{' '}
                  {new Date(comprador.created_at).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </dd>
              </div>
              {comprador.ultimo_acesso && (
                <div>
                  <dt className={adminSubtleClass()}>Último acesso</dt>
                  <dd className="text-[var(--admin-text-muted)]">
                    {new Date(comprador.ultimo_acesso).toLocaleDateString('pt-BR')}
                  </dd>
                </div>
              )}
            </dl>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          {agendamentos.length > 0 && (
            <Card surface="admin">
              <h2 className={adminSectionTitleClass('mb-4')}>
                Agendamentos
                <span className="ml-2 rounded-full bg-[var(--admin-badge-neutral-bg)] px-2 py-0.5 text-xs font-medium text-[var(--admin-accent)]">
                  {agendamentos.length}
                </span>
              </h2>
              <div className="space-y-3">
                {agendamentos.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-lg bg-[var(--admin-surface-elevated)] px-4 py-3"
                  >
                    <div>
                      <div className="text-sm font-medium text-[var(--admin-text)]">
                        {new Date(`${a.data_evento}T12:00:00`).toLocaleDateString('pt-BR', {
                          weekday: 'long',
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </div>
                      <div className={cn('mt-0.5 text-xs', adminSubtleClass())}>
                        Pedido #{a.pedido_id} · {formatBRL(a.pedido_total)}
                      </div>
                    </div>
                    <StatusBadge status={a.status === 'confirmado' ? 'pago' : 'cancelado'}>
                      {a.status === 'confirmado' ? 'Confirmado' : 'Cancelado'}
                    </StatusBadge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card surface="admin">
            <h2 className={adminSectionTitleClass('mb-4')}>
              Histórico de pedidos
              <span className="ml-2 rounded-full bg-[var(--admin-badge-neutral-bg)] px-2 py-0.5 text-xs font-medium text-[var(--admin-badge-neutral-text)]">
                {pedidos.length}
              </span>
            </h2>

            {pedidos.length === 0 ? (
              <p className={cn('py-6 text-center text-sm', adminSubtleClass())}>
                Nenhum pedido realizado ainda.
              </p>
            ) : (
              <div className="space-y-4">
                {pedidos.map((p) => (
                  <div key={p.id} className="overflow-hidden rounded-xl border border-[var(--admin-border)]">
                    <div className="flex items-center justify-between bg-[var(--admin-surface-elevated)] px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-[var(--admin-text)]">
                          Pedido #{p.id}
                        </span>
                        <StatusBadge status={p.status}>
                          {STATUS_LABEL[p.status] ?? p.status}
                        </StatusBadge>
                      </div>
                      <div className={cn('flex items-center gap-4 text-xs', adminSubtleClass())}>
                        <span>
                          {new Date(p.created_at).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(p.created_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span className="text-sm font-semibold text-[var(--admin-text)]">
                          {formatBRL(p.total)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1.5 px-4 py-3">
                      {p.itens.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className={adminMutedClass()}>
                            {item.quantidade}× {item.nome}
                          </span>
                          <span className={adminSubtleClass()}>{formatBRL(item.subtotal)}</span>
                        </div>
                      ))}
                      {p.frete > 0 && (
                        <div className={cn('flex justify-between border-t border-[var(--admin-border)] pt-1 text-xs', adminSubtleClass())}>
                          <span>Frete</span>
                          <span>{formatBRL(p.frete)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
