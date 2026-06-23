import { Button } from '@lojao/ui';
import { testIds } from '@lojao/test-utils';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { PlatformUiThemeSwitch } from '../components/platform-ui-theme-switch';
import {
  AtaLabsBrand,
  platformAuthCardClass,
  platformAuthInputClass,
  platformAuthLabelClass,
  platformAuthShellClass,
} from '../components/ata-brand';
import { ApiError } from '../lib/api-client';
import { useAuth } from '../lib/auth-context';

export function PlatformLoginPage() {
  const { platformLogin, isAuthenticated, isPlatformAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  useEffect(() => {
    if (!isLoading && isAuthenticated && isPlatformAdmin) {
      navigate('/platform/tenants', { replace: true });
    }
  }, [isLoading, isAuthenticated, isPlatformAdmin, navigate]);

  const mutation = useMutation({
    mutationFn: () => platformLogin(email, senha),
    onSuccess: () => navigate('/platform/tenants', { replace: true }),
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
    <div className={platformAuthShellClass()}>
      <div className="absolute right-4 top-4 z-10 pt-[env(safe-area-inset-top)]">
        <PlatformUiThemeSwitch inset={false} />
      </div>

      <div className={platformAuthCardClass()}>
        <AtaLabsBrand subtitle="Acesso de operador da plataforma." />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className={platformAuthLabelClass()}>
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid={testIds.platform.loginEmail}
              className={platformAuthInputClass()}
            />
          </div>

          <div>
            <label htmlFor="senha" className={platformAuthLabelClass()}>
              Senha
            </label>
            <input
              id="senha"
              type="password"
              autoComplete="current-password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              data-testid={testIds.platform.loginPassword}
              className={platformAuthInputClass()}
            />
          </div>

          {errorMessage && (
            <p data-testid={testIds.platform.loginError} className="ds-alert-error-platform">
              {errorMessage}
            </p>
          )}

          <Button
            type="submit"
            surface="platform"
            disabled={mutation.isPending}
            data-testid={testIds.platform.loginSubmit}
            className="w-full"
          >
            {mutation.isPending ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>

        <a href="/login" className="ds-link mt-6 block text-center text-sm">
          Sou lojista
        </a>
      </div>
    </div>
  );
}
