'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';

import { ApiError, recoverPassword } from '@/lib/client-api';

export function RecoverPasswordForm() {
  const [email, setEmail] = useState('');
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const message = await recoverPassword(email);
      setInfo(message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao enviar solicitação.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <h1 className="mb-1 text-2xl font-bold">Recuperar senha</h1>
      <p className="mb-6 text-sm text-gray-500">Informe seu e-mail para receber o link de redefinição.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        {info ? <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{info}</p> : null}
        {error ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

        <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
          {loading ? 'Enviando…' : 'Enviar link'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm">
        <Link href="/login" className="text-blue-600 hover:underline">
          Voltar ao login
        </Link>
      </p>
    </div>
  );
}
