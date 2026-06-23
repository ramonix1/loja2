import {
  Button,
  Card,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  adminEmptyStateClass,
  adminFieldLabelClass,
  adminInputClass,
  adminMutedClass,
  adminPageSubtitleClass,
  adminPageTitleClass,
  adminSectionTitleClass,
  StatusBadge,
  adminSubtleClass,
  cn,
} from '@lojao/ui';
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
    return <p className={adminMutedClass()}>Carregando permissões…</p>;
  }

  if (isError) {
    return (
      <p className="ds-alert-error" data-testid={testIds.adminPermissoes.errorMsg}>
        Erro ao carregar administradores.
      </p>
    );
  }

  return (
    <div data-testid={testIds.adminPermissoes.panel}>
      <div className="mb-6">
        <h1 className={adminPageTitleClass()}>Permissões do Sistema</h1>
        <p className={adminPageSubtitleClass('mt-1')}>
          Gerencie os administradores com acesso ao painel
        </p>
      </div>

      {feedback?.type === 'success' && (
        <div className="ds-alert-success mb-6" data-testid={testIds.adminPermissoes.successMsg}>
          {feedback.msg}
        </div>
      )}
      {feedback?.type === 'error' && (
        <div className="ds-alert-error mb-6" data-testid={testIds.adminPermissoes.errorMsg}>
          {feedback.msg}
        </div>
      )}

      <Card surface="admin" className="mb-8 max-w-2xl p-6">
        <h2 className={adminSectionTitleClass('mb-5 text-lg')}>Adicionar Administrador</h2>
        <form
          className="space-y-4"
          data-testid={testIds.adminPermissoes.createForm}
          onSubmit={handleCreate}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={adminFieldLabelClass()}>Nome *</label>
              <input
                type="text"
                required
                value={nome}
                placeholder="Nome completo"
                data-testid={testIds.adminPermissoes.nomeInput}
                onChange={(e) => setNome(e.target.value)}
                className={adminInputClass()}
              />
            </div>
            <div>
              <label className={adminFieldLabelClass()}>Email *</label>
              <input
                type="email"
                required
                value={email}
                placeholder="admin@email.com"
                data-testid={testIds.adminPermissoes.emailInput}
                onChange={(e) => setEmail(e.target.value)}
                className={adminInputClass()}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={adminFieldLabelClass()}>Senha *</label>
              <div className="relative">
                <input
                  type={showSenha ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={senha}
                  placeholder="Mínimo 8 caracteres"
                  data-testid={testIds.adminPermissoes.senhaInput}
                  onChange={(e) => setSenha(e.target.value)}
                  className={adminInputClass('pr-10')}
                />
                <button
                  type="button"
                  onClick={() => setShowSenha((v) => !v)}
                  className={cn('absolute top-1/2 right-3 -translate-y-1/2 text-xs', adminMutedClass())}
                >
                  {showSenha ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </div>
            <div>
              <label className={adminFieldLabelClass()}>CPF</label>
              <input
                type="text"
                value={cpf}
                maxLength={14}
                placeholder="000.000.000-00"
                data-testid={testIds.adminPermissoes.cpfInput}
                onChange={(e) => setCpf(mascaraCpf(e.target.value))}
                className={adminInputClass()}
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

      <Card surface="admin" className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className={adminSectionTitleClass('text-lg')}>Administradores Cadastrados</h2>
          <span className={adminPageSubtitleClass()}>
            {admins.length} admin{admins.length !== 1 ? 's' : ''}
          </span>
        </div>

        {admins.length === 0 ? (
          <div
            className={adminEmptyStateClass('py-12')}
            data-testid={testIds.adminPermissoes.emptyState}
          >
            <p className={adminMutedClass()}>Nenhum administrador cadastrado</p>
          </div>
        ) : (
          <Table surface="admin" data-testid={testIds.adminPermissoes.table}>
            <TableHead surface="admin">
              <TableRow surface="admin">
                <TableHeaderCell>Nome</TableHeaderCell>
                <TableHeaderCell>Email</TableHeaderCell>
                <TableHeaderCell>CPF</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Último acesso</TableHeaderCell>
                <TableHeaderCell>Ações</TableHeaderCell>
              </TableRow>
            </TableHead>
            <tbody>
              {admins.map((admin) => {
                const isSelf = admin.id === user?.id;
                return (
                  <TableRow
                    key={admin.id}
                    surface="admin"
                    data-testid={testIds.adminPermissoes.row(admin.id)}
                  >
                    <TableCell className="text-sm font-medium">{admin.nome}</TableCell>
                    <TableCell className="text-sm">{admin.email}</TableCell>
                    <TableCell className={cn('text-sm', adminMutedClass())}>{admin.cpf ?? '—'}</TableCell>
                    <TableCell>
                      <StatusBadge status={admin.ativo ? 'pago' : 'cancelado'}>
                        {admin.ativo ? 'Ativo' : 'Inativo'}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className={cn('text-xs', adminMutedClass())}>
                      {formatUltimoAcesso(admin.ultimo_acesso)}
                    </TableCell>
                    <TableCell>
                      {isSelf ? (
                        <span className={cn('px-2 py-1 text-xs italic', adminSubtleClass())}>
                          Você mesmo
                        </span>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={toggleMutation.isPending}
                            data-testid={testIds.adminPermissoes.toggleBtn(admin.id)}
                            className="px-3 py-1.5 text-xs"
                            onClick={() => toggleMutation.mutate(admin.id)}
                          >
                            {admin.ativo ? 'Suspender' : 'Ativar'}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            disabled={deleteMutation.isPending}
                            data-testid={testIds.adminPermissoes.deleteBtn(admin.id)}
                            className="px-3 py-1.5 text-xs text-[var(--admin-error-text)] hover:bg-[var(--admin-error-bg)]"
                            onClick={() => handleDelete(admin)}
                          >
                            Remover
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
