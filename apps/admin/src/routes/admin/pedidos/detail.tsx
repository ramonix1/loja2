import type { PedidoDetalhe, PedidoStatus } from '@lojao/types/pedidos';
import { PEDIDO_STATUS } from '@lojao/types/pedidos';
import {
  Button,
  Card,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  adminEmptyStateClass,
  FieldInput,
  FieldNativeSelect,
  adminFieldLabelClass,
  adminMutedClass,
  adminPageTitleClass,
  adminSubtleClass,
  cn,
  StatusBadge,
} from '@lojao/ui';
import { testIds } from '@lojao/test-utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { apiFetch } from '../../../lib/api-client';
import { formatBRL } from '../../../lib/currency';

const STATUS_LABEL: Record<PedidoStatus, string> = {
  aguardando_pagamento: 'Aguardando pagamento',
  pago: 'Pago',
  em_separacao: 'Em separação',
  enviado: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

function metodoLabel(metodo: string | null): string {
  if (!metodo) return '—';
  if (metodo === 'pix') return 'PIX';
  if (metodo === 'boleto') return 'Boleto';
  return 'Cartão';
}

function fetchPedido(id: string) {
  return apiFetch<{ data: PedidoDetalhe }>(`/api/v1/admin/pedidos/${id}`).then((r) => r.data);
}

export function PedidoDetailPage() {
  const { id = '' } = useParams();
  const queryClient = useQueryClient();
  const { data: pedido, isLoading, isError } = useQuery({
    queryKey: ['admin', 'pedidos', id],
    queryFn: () => fetchPedido(id),
    enabled: Boolean(id),
  });

  const [status, setStatus] = useState<PedidoStatus | ''>('');
  const [rastreio, setRastreio] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);

  const currentStatus = (status || pedido?.status || 'aguardando_pagamento') as PedidoStatus;
  const showRastreio = currentStatus === 'enviado';

  const saveMutation = useMutation({
    mutationFn: async () => {
      setSaveError(null);
      return apiFetch<{ data: PedidoDetalhe }>(`/api/v1/admin/pedidos/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: currentStatus,
          codigo_rastreio: showRastreio ? rastreio || null : null,
        }),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'pedidos'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
    onError: () => setSaveError('Não foi possível salvar o status.'),
  });

  if (isLoading) {
    return (
      <div className={adminEmptyStateClass('p-8')}>
        Carregando pedido…
      </div>
    );
  }

  if (isError || !pedido) {
    return (
      <div>
        <Link
          to="/admin/pedidos"
          data-testid={testIds.adminPedidoDetail.backLink}
          className="ds-link mb-4 inline-block text-sm"
        >
          ← Voltar a pedidos
        </Link>
        <p className="ds-alert-error text-sm">
          Pedido não encontrado.
        </p>
      </div>
    );
  }

  return (
    <div data-testid={testIds.adminPedidoDetail.panel}>
      <Link
        to="/admin/pedidos"
        data-testid={testIds.adminPedidoDetail.backLink}
        className="ds-link mb-4 inline-block text-sm"
      >
        ← Voltar a pedidos
      </Link>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className={adminPageTitleClass()}>Pedido #{pedido.id}</h1>
        <StatusBadge status={pedido.status}>
          {STATUS_LABEL[pedido.status] ?? pedido.status}
        </StatusBadge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card surface="admin" title="Itens do pedido">
            <Table surface="admin" data-testid={testIds.adminPedidoDetail.itemsTable}>
              <TableHead surface="admin">
                <TableRow surface="admin">
                  <TableHeaderCell>Produto</TableHeaderCell>
                  <TableHeaderCell className="text-right">Qtd</TableHeaderCell>
                  <TableHeaderCell className="text-right">Unit.</TableHeaderCell>
                  <TableHeaderCell className="text-right">Subtotal</TableHeaderCell>
                </TableRow>
              </TableHead>
              <tbody>
                {pedido.itens.map((item) => (
                  <TableRow key={item.id} surface="admin">
                    <TableCell>{item.nome_produto}</TableCell>
                    <TableCell className="text-right">{item.quantidade}</TableCell>
                    <TableCell className="text-right">
                      {formatBRL(item.preco_unitario)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatBRL(item.subtotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
            <div className="mt-4 space-y-1 border-t border-[var(--admin-border)] pt-4 text-sm">
              <div className={cn('flex justify-between', adminMutedClass())}>
                <span>Subtotal</span>
                <span>{formatBRL(pedido.subtotal)}</span>
              </div>
              <div className={cn('flex justify-between', adminMutedClass())}>
                <span>Frete</span>
                <span>{formatBRL(pedido.frete)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-[var(--admin-text)]">
                <span>Total</span>
                <span className="text-[var(--admin-accent)]">{formatBRL(pedido.total)}</span>
              </div>
            </div>
          </Card>

          <Card surface="admin" title="Cliente">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className={adminSubtleClass()}>Nome</dt>
                <dd className="text-[var(--admin-text)]">{pedido.usuario_nome}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className={adminSubtleClass()}>E-mail</dt>
                <dd className="text-[var(--admin-text)]">{pedido.usuario_email}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className={adminSubtleClass()}>Telefone</dt>
                <dd className="text-[var(--admin-text)]">{pedido.telefone_entrega ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className={adminSubtleClass()}>CPF</dt>
                <dd className="text-[var(--admin-text)]">{pedido.cpf_entrega ?? '—'}</dd>
              </div>
            </dl>
          </Card>

          <Card surface="admin" title="Endereço de entrega">
            {pedido.logradouro ? (
              <p className="text-sm leading-relaxed text-[var(--admin-text-muted)]">
                {pedido.logradouro}, {pedido.numero}
                {pedido.complemento ? `, ${pedido.complemento}` : ''}
                <br />
                {pedido.bairro} — {pedido.cidade}/{pedido.estado}
                <br />
                CEP: {pedido.cep}
              </p>
            ) : (
              <p className={cn('text-sm', adminSubtleClass())}>Endereço não informado.</p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card surface="admin" title="Pagamento">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className={adminSubtleClass()}>Método</dt>
                <dd className="text-[var(--admin-text)]">{metodoLabel(pedido.metodo_pagamento)}</dd>
              </div>
              {pedido.pagamento && (
                <>
                  <div className="flex justify-between gap-4">
                    <dt className={adminSubtleClass()}>Status MP</dt>
                    <dd className="text-[var(--admin-text)]">{pedido.pagamento.status_mp ?? '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className={adminSubtleClass()}>ID MP</dt>
                    <dd className="break-all text-right text-xs text-[var(--admin-text-muted)]">
                      {pedido.pagamento.mp_payment_id ?? '—'}
                    </dd>
                  </div>
                </>
              )}
              <div className="flex justify-between gap-4">
                <dt className={adminSubtleClass()}>Data</dt>
                <dd className="text-[var(--admin-text)]">
                  {new Date(pedido.created_at).toLocaleString('pt-BR')}
                </dd>
              </div>
            </dl>
          </Card>

          <Card surface="admin" title="Atualizar status">
            <div className="space-y-3">
              <label className={adminFieldLabelClass('text-xs')} htmlFor="pedido-status">
                Status
              </label>
              <FieldNativeSelect
                id="pedido-status"
                data-testid={testIds.adminPedidoDetail.statusSelect}
                value={status || pedido.status}
                onChange={(e) => setStatus(e.target.value as PedidoStatus)}
              >
                {PEDIDO_STATUS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </FieldNativeSelect>

              {showRastreio && (
                <div>
                  <label className={adminFieldLabelClass('text-xs')} htmlFor="rastreio">
                    Código de rastreio
                  </label>
                  <FieldInput
                    id="rastreio"
                    type="text"
                    data-testid={testIds.adminPedidoDetail.rastreioInput}
                    value={rastreio || pedido.codigo_rastreio || ''}
                    onChange={(e) => setRastreio(e.target.value)}
                    placeholder="Ex: BR123456789BR"
                  />
                  <p className={cn('mt-1 text-xs', adminSubtleClass())}>
                    E-mail de rastreio ainda é enviado pelo legacy (desvio documentado).
                  </p>
                </div>
              )}

              {saveError && <p className="ds-alert-error text-sm">{saveError}</p>}

              <Button
                data-testid={testIds.adminPedidoDetail.saveBtn}
                className="w-full"
                disabled={saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                {saveMutation.isPending ? 'Salvando…' : 'Salvar'}
              </Button>
            </div>
          </Card>

          {pedido.codigo_rastreio && (
            <Card surface="admin" title="Rastreio">
              <p className="font-mono text-lg font-bold tracking-wide text-[var(--admin-accent)]">
                {pedido.codigo_rastreio}
              </p>
              <a
                href="https://www.correios.com.br/rastreamento"
                target="_blank"
                rel="noreferrer"
                className="ds-link mt-2 inline-block text-xs"
              >
                Verificar nos Correios →
              </a>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
