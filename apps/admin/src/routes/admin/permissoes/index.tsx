import { Button, Card, Table, cn } from '@lojao/ui';
import { testIds } from '@lojao/test-utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';

import { ApiError, apiFetch } from '../../../lib/api-client';
import { useAuth } from '../../../lib/auth-context';

interface AdminUsuario {
  id: number;
  nome: string;
  email: string;
  cpf: string | null;
  ativo: boolean;
  ultimo_acesso: string | null;
  created_at: string;
}

function fetchPermissoes() {
  return apiFetch<{ data: AdminUsuario[] }>('/api/v1/admin/permissoes').then((r) => r.data);
}

function mascaraCpf(value: string): string {
  const n = value.replace(/\D/g, '').slice(0, 11);
  return n
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

function formatUltimoAcesso(value: string | null): string {
  if (!value) return 'Nunca';
  return new Date(value).toLocaleString('pt-BR');
}

export function PermissoesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [cpf, setCpf] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(
    null,
  );

  const { data: admins = [], isLoading, isError } = useQuery({
    queryKey: ['admin', 'permissoes'],
    queryFn: fetchPermissoes,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'permissoes'] });

  const createMutation = useMutation({
    mutationFn: (body: { nome: string; email: string; senha: string; cpf?: string }) =>
      apiFetch('/api/v1/admin/permissoes', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      setFeedback({ type: 'success', msg: 'Admin criado com sucesso.' });
      setNome('');
      setEmail('');
      setSenha('');
      setCpf('');
      invalidate();
    },
    onError: (err) => {
      setFeedback({
        type: 'error',
        msg: err instanceof ApiError ? err.message : 'Erro ao criar administrador.',
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/api/v1/admin/permissoes/${id}/toggle`, { method: 'PATCH' }),
    onSuccess: () => {
      setFeedback({ type: 'success', msg: 'Status atualizado.' });
      invalidate();
    },
    onError: (err) => {
      setFeedback({
        type: 'error',
        msg: err instanceof ApiError ? err.message : 'Erro ao alterar status.',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/api/v1/admin/permissoes/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      setFeedback({ type: 'success', msg: 'Administrador removido.' });
      invalidate();
    },
    onError: (err) => {
      setFeedback({
        type: 'error',
        msg: err instanceof ApiError ? err.message : 'Erro ao remover administrador.',
      });
    },
  });

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);
    createMutation.mutate({
      nome,
      email,
      senha,
      cpf: cpf.trim() || undefined,
    });
  }

  function handleDelete(admin: AdminUsuario) {
    if (!window.confirm(`Remover o acesso de ${admin.nome}?`)) return;
    setFeedback(null);
    deleteMutation.mutate(admin.id);
  }

  if (isLoading) {
    return <p className="text-gray-400">Carregando permissões…</p>;
  }

  if (isError) {
    return (
      <p className="text-red-400" data-testid={testIds.adminPermissoes.errorMsg}>
        Erro ao carregar administradores.
      </p>
    );
  }

  return (
    <div data-testid={testIds.adminPermissoes.panel}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Permissões do Sistema</h1>
        <p className="mt-1 text-sm text-gray-400">
          Gerencie os administradores com acesso ao painel
        </p>
      </div>

      {feedback?.type === 'success' && (
        <div
          className="mb-6 rounded-xl border border-green-700 bg-green-900 px-5 py-3 text-sm text-green-300"
          data-testid={testIds.adminPermissoes.successMsg}
        >
          {feedback.msg}
        </div>
      )}
      {feedback?.type === 'error' && (
        <div
          className="mb-6 rounded-xl border border-red-700 bg-red-900 px-5 py-3 text-sm text-red-300"
          data-testid={testIds.adminPermissoes.errorMsg}
        >
          {feedback.msg}
        </div>
      )}

      <Card className="mb-8 max-w-2xl p-6">
        <h2 className="mb-5 text-lg font-bold text-white">Adicionar Administrador</h2>
        <form
          className="space-y-4"
          data-testid={testIds.adminPermissoes.createForm}
          onSubmit={handleCreate}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">Nome *</label>
              <input
                type="text"
                required
                value={nome}
                placeholder="Nome completo"
                data-testid={testIds.adminPermissoes.nomeInput}
                onChange={(e) => setNome(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">Email *</label>
              <input
                type="email"
                required
                value={email}
                placeholder="admin@email.com"
                data-testid={testIds.adminPermissoes.emailInput}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">Senha *</label>
              <div className="relative">
                <input
                  type={showSenha ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={senha}
                  placeholder="Mínimo 8 caracteres"
                  data-testid={testIds.adminPermissoes.senhaInput}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 pr-10 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowSenha((v) => !v)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-gray-400"
                >
                  {showSenha ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">CPF</label>
              <input
                type="text"
                value={cpf}
                maxLength={14}
                placeholder="000.000.000-00"
                data-testid={testIds.adminPermissoes.cpfInput}
                onChange={(e) => setCpf(mascaraCpf(e.target.value))}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={createMutation.isPending}
            data-testid={testIds.adminPermissoes.createBtn}
          >
            Criar Administrador
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Administradores Cadastrados</h2>
          <span className="text-sm text-gray-400">
            {admins.length} admin{admins.length !== 1 ? 's' : ''}
          </span>
        </div>

        {admins.length === 0 ? (
          <div
            className="rounded-xl bg-gray-800 py-12 text-center"
            data-testid={testIds.adminPermissoes.emptyState}
          >
            <p className="text-gray-400">Nenhum administrador cadastrado</p>
          </div>
        ) : (
          <Table data-testid={testIds.adminPermissoes.table}>
            <thead>
              <tr className="border-b border-gray-800">
                <th className="pb-3 text-left text-xs font-semibold uppercase text-gray-500">
                  Nome
                </th>
                <th className="pb-3 text-left text-xs font-semibold uppercase text-gray-500">
                  Email
                </th>
                <th className="pb-3 text-left text-xs font-semibold uppercase text-gray-500">
                  CPF
                </th>
                <th className="pb-3 text-left text-xs font-semibold uppercase text-gray-500">
                  Status
                </th>
                <th className="pb-3 text-left text-xs font-semibold uppercase text-gray-500">
                  Último acesso
                </th>
                <th className="pb-3 text-left text-xs font-semibold uppercase text-gray-500">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {admins.map((admin) => {
                const isSelf = admin.id === user?.id;
                return (
                  <tr
                    key={admin.id}
                    data-testid={testIds.adminPermissoes.row(admin.id)}
                    className="hover:bg-gray-800/40"
                  >
                    <td className="py-3 pr-4 text-sm font-medium text-white">{admin.nome}</td>
                    <td className="py-3 pr-4 text-sm text-gray-300">{admin.email}</td>
                    <td className="py-3 pr-4 text-sm text-gray-400">{admin.cpf ?? '—'}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={cn(
                          'rounded-full px-2 py-1 text-xs font-semibold',
                          admin.ativo
                            ? 'bg-green-900 text-green-300'
                            : 'bg-red-900 text-red-300',
                        )}
                      >
                        {admin.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-xs text-gray-400">
                      {formatUltimoAcesso(admin.ultimo_acesso)}
                    </td>
                    <td className="py-3">
                      {isSelf ? (
                        <span className="px-2 py-1 text-xs italic text-gray-600">Você mesmo</span>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={toggleMutation.isPending}
                            data-testid={testIds.adminPermissoes.toggleBtn(admin.id)}
                            className={cn(
                              'px-3 py-1.5 text-xs',
                              admin.ativo
                                ? 'bg-yellow-700 text-yellow-200 hover:bg-yellow-600'
                                : 'bg-green-700 text-green-200 hover:bg-green-600',
                            )}
                            onClick={() => toggleMutation.mutate(admin.id)}
                          >
                            {admin.ativo ? 'Suspender' : 'Ativar'}
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={deleteMutation.isPending}
                            data-testid={testIds.adminPermissoes.deleteBtn(admin.id)}
                            className="bg-red-700 px-3 py-1.5 text-xs text-white hover:bg-red-600"
                            onClick={() => handleDelete(admin)}
                          >
                            Remover
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
