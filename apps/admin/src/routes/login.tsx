import { Button } from '@lojao/ui';
import { testIds } from '@lojao/test-utils';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { ApiError } from '../lib/api-client';
import { useAuth } from '../lib/auth-context';

export function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  const mutation = useMutation({
    mutationFn: () => login(email, senha),
    onSuccess: () => navigate('/admin/dashboard', { replace: true }),
  });

  const errorMessage =
    mutation.error instanceof ApiError
      ? mutation.error.message
      : mutation.error
        ? 'Não foi possível entrar. Tente novamente.'
        : null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-xl">
        <h1 className="mb-1 text-xl font-bold text-white">Lojão — Painel Admin</h1>
        <p className="mb-6 text-sm text-gray-400">Entre com sua conta de administrador.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-300">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid={testIds.auth.loginEmail}
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="senha" className="mb-1 block text-sm font-medium text-gray-300">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              autoComplete="current-password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              data-testid={testIds.auth.loginPassword}
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 outline-none focus:border-blue-500"
            />
          </div>

          {errorMessage && (
            <p
              data-testid={testIds.auth.loginError}
              className="rounded-lg border border-red-900 bg-red-950 px-3 py-2 text-sm text-red-300"
            >
              {errorMessage}
            </p>
          )}

          <Button
            type="submit"
            disabled={mutation.isPending}
            data-testid={testIds.auth.loginSubmit}
            className="w-full"
          >
            {mutation.isPending ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  );
}
