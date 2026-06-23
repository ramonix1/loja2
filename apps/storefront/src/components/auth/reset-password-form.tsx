'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { ApiError, resetPassword } from '@/lib/client-api';
import {
  storeErrorTextClass,
  storeInputClass,
  storeLabelClass,
  storeLinkClass,
  storePanelClass,
  storeSectionTitleClass,
} from '@/lib/store-styles';
import { useStoreHref } from '@/lib/use-store-href';

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const loginHref = useStoreHref('/login');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await resetPassword(token, senha, confirmacao);
      router.push(`${loginHref}?info=senha-redefinida`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível redefinir a senha.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={storePanelClass('mx-auto max-w-md rounded-2xl p-8')}>
      <h1 className={storeSectionTitleClass('mb-6')}>Nova senha</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={storeLabelClass()}>Nova senha</label>
          <input
            type="password"
            required
            minLength={8}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className={storeInputClass()}
          />
        </div>
        <div>
          <label className={storeLabelClass()}>Confirmar senha</label>
          <input
            type="password"
            required
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
            className={storeInputClass()}
          />
        </div>

        {error ? <p className={storeErrorTextClass('text-sm')}>{error}</p> : null}

        <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
          {loading ? 'Salvando…' : 'Redefinir senha'}
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
