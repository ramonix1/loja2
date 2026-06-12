import { Button, Card, cn } from '@lojao/ui';
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

const STATUS_STYLES: Record<string, string> = {
  aguardando_pagamento: 'bg-yellow-900/50 text-yellow-400',
  pago: 'bg-blue-900/50 text-blue-400',
  em_separacao: 'bg-purple-900/50 text-purple-400',
  enviado: 'bg-indigo-900/50 text-indigo-400',
  entregue: 'bg-green-900/50 text-green-400',
  cancelado: 'bg-red-900/50 text-red-400',
};

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
    return <Card className="text-center text-gray-400">Carregando ficha…</Card>;
  }

  if (isError || !data) {
    return (
      <div>
        <p className="mb-4 text-red-400">Comprador não encontrado.</p>
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
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold">
            {comprador.nome.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{comprador.nome}</h1>
            <div className="mt-1 flex items-center gap-3">
              <span className="text-sm text-gray-400">{comprador.email}</span>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  comprador.ativo
                    ? 'bg-green-900/50 text-green-400'
                    : 'bg-red-900/50 text-red-400',
                )}
              >
                {comprador.ativo ? 'Ativo' : 'Inativo'}
              </span>
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
        <Card>
          <div className="text-xs text-gray-500">Total de pedidos</div>
          <div className="mt-1 text-2xl font-bold text-white">{resumo.total_pedidos}</div>
        </Card>
        <Card>
          <div className="text-xs text-gray-500">Total gasto</div>
          <div className="mt-1 text-2xl font-bold text-green-400">
            {formatBRL(resumo.total_gasto)}
          </div>
        </Card>
        <Card>
          <div className="text-xs text-gray-500">Agendamentos</div>
          <div className="mt-1 text-2xl font-bold text-blue-400">{agendamentos.length}</div>
        </Card>
        <Card>
          <div className="text-xs text-gray-500">Cliente desde</div>
          <div className="mt-1 text-lg font-bold text-white">
            {new Date(comprador.created_at).toLocaleDateString('pt-BR')}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4">
          <Card>
            <h2 className="mb-4 font-semibold text-white">Dados pessoais</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-gray-500">Nome completo</dt>
                <dd className="text-gray-200">{comprador.nome}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">E-mail</dt>
                <dd className="text-gray-200">{comprador.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Telefone</dt>
                <dd className="text-gray-200">{comprador.telefone ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">CPF</dt>
                <dd className="text-gray-200">{comprador.cpf ?? '—'}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h2 className="mb-4 font-semibold text-white">Endereço</h2>
            {temEndereco ? (
              <div className="space-y-2 text-sm text-gray-200">
                {comprador.logradouro && (
                  <p>
                    {comprador.logradouro}, {comprador.numero}
                    {comprador.complemento ? ` — ${comprador.complemento}` : ''}
                  </p>
                )}
                {comprador.bairro && <p className="text-gray-400">{comprador.bairro}</p>}
                {comprador.cidade && (
                  <p>
                    {comprador.cidade} / {comprador.estado}
                  </p>
                )}
                {comprador.cep && <p className="text-gray-500">CEP: {comprador.cep}</p>}
              </div>
            ) : (
              <p className="text-sm text-gray-600">Endereço não informado</p>
            )}
          </Card>

          <Card>
            <h2 className="mb-4 font-semibold text-white">Conta</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-gray-500">Cadastro</dt>
                <dd className="text-gray-200">
                  {new Date(comprador.created_at).toLocaleDateString('pt-BR')} às{' '}
                  {new Date(comprador.created_at).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </dd>
              </div>
              {comprador.ultimo_acesso && (
                <div>
                  <dt className="text-xs text-gray-500">Último acesso</dt>
                  <dd className="text-gray-200">
                    {new Date(comprador.ultimo_acesso).toLocaleDateString('pt-BR')}
                  </dd>
                </div>
              )}
            </dl>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          {agendamentos.length > 0 && (
            <Card>
              <h2 className="mb-4 font-semibold text-white">
                Agendamentos
                <span className="ml-2 rounded-full bg-blue-900/50 px-2 py-0.5 text-xs font-medium text-blue-400">
                  {agendamentos.length}
                </span>
              </h2>
              <div className="space-y-3">
                {agendamentos.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-lg bg-gray-800 px-4 py-3"
                  >
                    <div>
                      <div className="text-sm font-medium text-white">
                        {new Date(`${a.data_evento}T12:00:00`).toLocaleDateString('pt-BR', {
                          weekday: 'long',
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="mt-0.5 text-xs text-gray-500">
                        Pedido #{a.pedido_id} · {formatBRL(a.pedido_total)}
                      </div>
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-2 py-1 text-xs',
                        a.status === 'confirmado'
                          ? 'bg-green-900/50 text-green-400'
                          : 'bg-red-900/50 text-red-400',
                      )}
                    >
                      {a.status === 'confirmado' ? 'Confirmado' : 'Cancelado'}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <h2 className="mb-4 font-semibold text-white">
              Histórico de pedidos
              <span className="ml-2 rounded-full bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-300">
                {pedidos.length}
              </span>
            </h2>

            {pedidos.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-600">
                Nenhum pedido realizado ainda.
              </p>
            ) : (
              <div className="space-y-4">
                {pedidos.map((p) => (
                  <div key={p.id} className="overflow-hidden rounded-xl border border-gray-800">
                    <div className="flex items-center justify-between bg-gray-800 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-white">Pedido #{p.id}</span>
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-xs',
                            STATUS_STYLES[p.status] ?? 'bg-gray-700 text-gray-400',
                          )}
                        >
                          {STATUS_LABEL[p.status] ?? p.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          {new Date(p.created_at).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(p.created_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span className="text-sm font-semibold text-white">
                          {formatBRL(p.total)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1.5 px-4 py-3">
                      {p.itens.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-300">
                            {item.quantidade}× {item.nome}
                          </span>
                          <span className="text-gray-400">{formatBRL(item.subtotal)}</span>
                        </div>
                      ))}
                      {p.frete > 0 && (
                        <div className="flex justify-between border-t border-gray-800 pt-1 text-xs text-gray-500">
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
