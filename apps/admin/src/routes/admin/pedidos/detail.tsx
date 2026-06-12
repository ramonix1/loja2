import type { PedidoDetalhe, PedidoStatus } from '@lojao/types/pedidos';
import { PEDIDO_STATUS } from '@lojao/types/pedidos';
import { Button, Card, Table, cn } from '@lojao/ui';
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

const STATUS_STYLES: Record<string, string> = {
  aguardando_pagamento: 'bg-yellow-900/50 text-yellow-400',
  pago: 'bg-green-900/50 text-green-400',
  em_separacao: 'bg-blue-900/50 text-blue-400',
  enviado: 'bg-indigo-900/50 text-indigo-400',
  entregue: 'bg-emerald-900/50 text-emerald-400',
  cancelado: 'bg-red-900/50 text-red-400',
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
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center text-gray-400">
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
          className="mb-4 inline-block text-sm text-blue-400 hover:text-blue-300"
        >
          ← Voltar a pedidos
        </Link>
        <p className="rounded-lg border border-red-900 bg-red-950 px-4 py-3 text-sm text-red-300">
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
        className="mb-4 inline-block text-sm text-blue-400 hover:text-blue-300"
      >
        ← Voltar a pedidos
      </Link>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-white">Pedido #{pedido.id}</h1>
        <span
          className={cn(
            'inline-block rounded-full px-3 py-1 text-xs font-medium',
            STATUS_STYLES[pedido.status] ?? 'bg-gray-800 text-gray-300',
          )}
        >
          {STATUS_LABEL[pedido.status] ?? pedido.status}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card title="Itens do pedido">
            <Table data-testid={testIds.adminPedidoDetail.itemsTable}>
              <thead>
                <tr className="border-b border-gray-800 text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3 text-left">Produto</th>
                  <th className="px-4 py-3 text-right">Qtd</th>
                  <th className="px-4 py-3 text-right">Unit.</th>
                  <th className="px-4 py-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {pedido.itens.map((item) => (
                  <tr key={item.id} className="border-b border-gray-800 last:border-0">
                    <td className="px-4 py-3 text-gray-100">{item.nome_produto}</td>
                    <td className="px-4 py-3 text-right text-gray-300">{item.quantidade}</td>
                    <td className="px-4 py-3 text-right text-gray-300">
                      {formatBRL(item.preco_unitario)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-100">
                      {formatBRL(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <div className="mt-4 space-y-1 border-t border-gray-800 pt-4 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span>{formatBRL(pedido.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Frete</span>
                <span>{formatBRL(pedido.frete)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-white">
                <span>Total</span>
                <span className="text-blue-400">{formatBRL(pedido.total)}</span>
              </div>
            </div>
          </Card>

          <Card title="Cliente">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Nome</dt>
                <dd className="text-right text-gray-100">{pedido.usuario_nome}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">E-mail</dt>
                <dd className="text-right text-gray-100">{pedido.usuario_email}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Telefone</dt>
                <dd className="text-right text-gray-100">{pedido.telefone_entrega ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">CPF</dt>
                <dd className="text-right text-gray-100">{pedido.cpf_entrega ?? '—'}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Endereço de entrega">
            {pedido.logradouro ? (
              <p className="text-sm leading-relaxed text-gray-300">
                {pedido.logradouro}, {pedido.numero}
                {pedido.complemento ? `, ${pedido.complemento}` : ''}
                <br />
                {pedido.bairro} — {pedido.cidade}/{pedido.estado}
                <br />
                CEP: {pedido.cep}
              </p>
            ) : (
              <p className="text-sm text-gray-500">Endereço não informado.</p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Pagamento">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Método</dt>
                <dd className="text-gray-100">{metodoLabel(pedido.metodo_pagamento)}</dd>
              </div>
              {pedido.pagamento && (
                <>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500">Status MP</dt>
                    <dd className="text-gray-100">{pedido.pagamento.status_mp ?? '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500">ID MP</dt>
                    <dd className="break-all text-right text-xs text-gray-300">
                      {pedido.pagamento.mp_payment_id ?? '—'}
                    </dd>
                  </div>
                </>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Data</dt>
                <dd className="text-gray-100">
                  {new Date(pedido.created_at).toLocaleString('pt-BR')}
                </dd>
              </div>
            </dl>
          </Card>

          <Card title="Atualizar status">
            <div className="space-y-3">
              <label className="block text-xs font-medium text-gray-400" htmlFor="pedido-status">
                Status
              </label>
              <select
                id="pedido-status"
                data-testid={testIds.adminPedidoDetail.statusSelect}
                value={status || pedido.status}
                onChange={(e) => setStatus(e.target.value as PedidoStatus)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
              >
                {PEDIDO_STATUS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>

              {showRastreio && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400" htmlFor="rastreio">
                    Código de rastreio
                  </label>
                  <input
                    id="rastreio"
                    type="text"
                    data-testid={testIds.adminPedidoDetail.rastreioInput}
                    value={rastreio || pedido.codigo_rastreio || ''}
                    onChange={(e) => setRastreio(e.target.value)}
                    placeholder="Ex: BR123456789BR"
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    E-mail de rastreio ainda é enviado pelo legacy (desvio documentado).
                  </p>
                </div>
              )}

              {saveError && <p className="text-sm text-red-400">{saveError}</p>}

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
            <Card title="Rastreio">
              <p className="font-mono text-lg font-bold tracking-wide text-blue-300">
                {pedido.codigo_rastreio}
              </p>
              <a
                href="https://www.correios.com.br/rastreamento"
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-xs text-blue-400 hover:text-blue-300"
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
