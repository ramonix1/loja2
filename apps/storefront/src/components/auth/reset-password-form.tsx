'use client';

import { Button, Card, FieldInput, Label } from '@lojao/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { ApiError, resetPassword } from '@/lib/client-api';
import {
  storeErrorTextClass,
  storeLinkClass,
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
    <Card surface="store" className="mx-auto max-w-md rounded-2xl p-8 shadow-sm">
      <h1 className={storeSectionTitleClass('mb-6')}>Nova senha</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label className="mb-1 block text-[var(--store-text-muted)]">Nova senha</Label>
          <FieldInput
            surface="store"
            type="password"
            required
            minLength={8}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </div>
        <div>
          <Label className="mb-1 block text-[var(--store-text-muted)]">Confirmar senha</Label>
          <FieldInput
            surface="store"
            type="password"
            required
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
          />
        </div>

        {error ? <p className={storeErrorTextClass('text-sm')}>{error}</p> : null}

        <Button
          type="submit"
          surface="store"
          variant="primary"
          disabled={loading}
          className="w-full py-2.5"
        >
          {loading ? 'Salvando…' : 'Redefinir senha'}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm">
        <Link href={loginHref} className={storeLinkClass()}>
          Voltar ao login
        </Link>
      </p>
    </Card>
  );
}
