'use client';

import { auth as testIds } from '@lojao/test-utils/test-ids/auth';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { ApiError, login } from '@/lib/client-api';
import { adminDashboardUrl } from '@/lib/config';

export function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/';
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await login(email, senha);
      if (user.role === 'admin') {
        window.location.href = adminDashboardUrl();
        return;
      }
      window.location.href = redirect;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível entrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Entrar</h1>
      <p className="mb-6 text-sm text-gray-500">Acesse sua conta para comprar.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-testid={testIds.loginEmail}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label htmlFor="senha" className="mb-1 block text-sm font-medium text-gray-700">
            Senha
          </label>
          <input
            id="senha"
            type="password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            data-testid={testIds.loginPassword}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>

        {error ? (
          <p
            data-testid={testIds.loginError}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          data-testid={testIds.loginSubmit}
          className="btn-primary w-full py-2.5"
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Não tem conta?{' '}
        <Link href="/cadastro" className="font-medium text-blue-600 hover:underline">
          Cadastre-se
        </Link>
      </p>
      <p className="mt-2 text-center text-sm">
        <Link href="/recuperar-senha" className="text-blue-600 hover:underline">
          Esqueci minha senha
        </Link>
      </p>
    </div>
  );
}
