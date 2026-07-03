'use client';

import { Button, Card, FieldInput, Label } from '@lojao/ui';
import { auth as testIds } from '@lojao/test-utils/test-ids/auth';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { ApiError, login } from '@/lib/client-api';
import { adminDashboardUrl } from '@/lib/config';
import {
  storeErrorTextClass,
  storeLinkClass,
  storeSectionTitleClass,
  storeSubtleClass,
} from '@/lib/store-styles';
import { useStoreHref } from '@/lib/use-store-href';

const MERCHANT_ROLES = new Set(['owner', 'admin', 'operator']);

export function LoginForm() {
  const searchParams = useSearchParams();
  const homeHref = useStoreHref('/');
  const redirect = searchParams.get('redirect') ?? homeHref;
  const cadastroHref = useStoreHref('/cadastro');
  const recuperarHref = useStoreHref('/recuperar-senha');
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
      if (user.redirectToAdmin || MERCHANT_ROLES.has(user.role)) {
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
    <Card surface="store" className="mx-auto max-w-md rounded-2xl p-8 shadow-sm">
      <h1 className={storeSectionTitleClass('mb-1')}>Entrar</h1>
      <p className={storeSubtleClass('mb-6 text-sm')}>Acesse sua conta para comprar.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email" className="mb-1 block text-[var(--store-text-muted)]">
            E-mail
          </Label>
          <FieldInput
            surface="store"
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-testid={testIds.loginEmail}
          />
        </div>
        <div>
          <Label htmlFor="senha" className="mb-1 block text-[var(--store-text-muted)]">
            Senha
          </Label>
          <FieldInput
            surface="store"
            id="senha"
            type="password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            data-testid={testIds.loginPassword}
          />
        </div>

        {error ? (
          <p
            data-testid={testIds.loginError}
            className={storeErrorTextClass(
              'rounded-lg border border-[color-mix(in_srgb,var(--store-error)_35%,transparent)] bg-[color-mix(in_srgb,var(--store-error)_12%,var(--store-surface))] px-3 py-2 text-sm',
            )}
          >
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          surface="store"
          variant="primary"
          disabled={loading}
          data-testid={testIds.loginSubmit}
          className="w-full py-2.5"
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>

      <p className={storeSubtleClass('mt-6 text-center text-sm')}>
        Não tem conta?{' '}
        <Link href={cadastroHref} className={storeLinkClass('font-medium')}>
          Cadastre-se
        </Link>
      </p>
      <p className="mt-2 text-center text-sm">
        <Link href={recuperarHref} className={storeLinkClass()}>
          Esqueci minha senha
        </Link>
      </p>
    </Card>
  );
}
