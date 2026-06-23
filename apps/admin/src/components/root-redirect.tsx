import { adminMutedClass, cn } from '@lojao/ui';
import { Navigate } from 'react-router-dom';

import { useAuth } from '../lib/auth-context';

/**
 * Redireciona a raiz conforme o papel autenticado:
 * - não autenticado → `/login`
 * - operador da plataforma → `/platform/tenants`
 * - lojista sem loja → `/admin/my-stores`
 * - lojista → `/admin/dashboard`
 */
export function RootRedirect() {
  const { isLoading, isAuthenticated, isPlatformAdmin, needsTenantSelection } = useAuth();

  if (isLoading) {
    return (
      <div className={cn('flex min-h-screen items-center justify-center', adminMutedClass())}>
        Carregando…
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isPlatformAdmin) return <Navigate to="/platform/tenants" replace />;
  if (needsTenantSelection) return <Navigate to="/admin/my-stores" replace />;
  return <Navigate to="/admin/dashboard" replace />;
}
