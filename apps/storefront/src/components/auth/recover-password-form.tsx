'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';

import { ApiError, recoverPassword } from '@/lib/client-api';
import {
  storeErrorTextClass,
  storeInputClass,
  storeLabelClass,
  storeLinkClass,
  storePanelClass,
  storeSectionTitleClass,
  storeSubtleClass,
} from '@/lib/store-styles';
import { useStoreHref } from '@/lib/use-store-href';

export function RecoverPasswordForm() {
  const loginHref = useStoreHref('/login');
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
    <div className={storePanelClass('mx-auto max-w-md rounded-2xl p-8')}>
      <h1 className={storeSectionTitleClass('mb-1')}>Recuperar senha</h1>
      <p className={storeSubtleClass('mb-6 text-sm')}>Informe seu e-mail para receber o link de redefinição.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className={storeLabelClass()}>
            E-mail
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={storeInputClass()}
          />
        </div>

        {info ? (
          <p className="rounded-lg border border-[color-mix(in_srgb,var(--store-success)_35%,transparent)] bg-[color-mix(in_srgb,var(--store-success)_12%,var(--store-surface))] p-3 text-sm text-[var(--store-success)]">
            {info}
          </p>
        ) : null}
        {error ? (
          <p
            className={storeErrorTextClass(
              'rounded-lg border border-[color-mix(in_srgb,var(--store-error)_35%,transparent)] bg-[color-mix(in_srgb,var(--store-error)_12%,var(--store-surface))] p-3 text-sm',
            )}
          >
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
          {loading ? 'Enviando…' : 'Enviar link'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm">
        <Link href={loginHref} className={storeLinkClass()}>
          Voltar ao login
        </Link>
      </p>
    </div>
  );
}
