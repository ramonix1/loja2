import { Button } from '@lojao/ui';
import { testIds } from '@lojao/test-utils';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { AdminUiThemeSwitch } from '../components/admin-ui-theme-switch';
import {
  AtaCommerceBrand,
  authCardClass,
  authInputClass,
  authLabelClass,
  authShellClass,
} from '../components/ata-brand';
import { ApiError } from '../lib/api-client';
import { useAuth } from '../lib/auth-context';

export function LoginPage() {
  const { login, isAuthenticated, isLoading, needsTenantSelection, isPlatformAdmin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (isPlatformAdmin) {
        navigate('/platform/tenants', { replace: true });
        return;
      }
      if (needsTenantSelection) {
        navigate('/admin/my-stores', { replace: true });
        return;
      }
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isLoading, isAuthenticated, needsTenantSelection, isPlatformAdmin, navigate]);

  const mutation = useMutation({
    mutationFn: () => login(email, senha),
    onSuccess: (step) => {
      if (step === 'select_tenant') {
        navigate('/admin/my-stores', { replace: true });
        return;
      }
      navigate('/admin/dashboard', { replace: true });
    },
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
    <div className={authShellClass()}>
      <div className="absolute right-4 top-4 z-10 pt-[env(safe-area-inset-top)]">
        <AdminUiThemeSwitch inset={false} />
      </div>

      <div className={authCardClass()}>
        <AtaCommerceBrand
          testId={testIds.auth.loginBrand}
          subtitle="Entre com sua conta de administrador."
        />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className={authLabelClass()}>
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
              className={authInputClass()}
            />
          </div>

          <div>
            <label htmlFor="senha" className={authLabelClass()}>
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
              className={authInputClass()}
            />
          </div>

          {errorMessage && (
            <p data-testid={testIds.auth.loginError} className="ds-alert-error">
              {errorMessage}
            </p>
          )}

          <Button
            type="submit"
            surface="admin"
            disabled={mutation.isPending}
            data-testid={testIds.auth.loginSubmit}
            className="w-full"
          >
            {mutation.isPending ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>

        <a
          href="/platform/login"
          className="ds-link mt-6 block text-center text-sm"
        >
          Acesso plataforma (Ata Labs)
        </a>
      </div>
    </div>
  );
}
