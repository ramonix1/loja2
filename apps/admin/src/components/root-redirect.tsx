import { adminMutedClass, cn } from '@lojao/ui';
import { Navigate } from 'react-router-dom';

import { useAuth } from '../lib/auth-context';

/**
 * Redireciona a raiz conforme o papel autenticado:
 * - não autenticado → `/login`
 * - operador da plataforma → `/platform/stores`
 * - lojista sem loja → `/admin/my-stores`
 * - lojista → `/admin/dashboard`
 */
export function RootRedirect() {
  const { isLoading, isAuthenticated, isPlatformAdmin, needsStoreSelection } = useAuth();

  if (isLoading) {
    return (
      <div className={cn('flex min-h-screen items-center justify-center', adminMutedClass())}>
        Carregando…
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isPlatformAdmin) return <Navigate to="/platform/stores" replace />;
  if (needsStoreSelection) return <Navigate to="/admin/my-stores" replace />;
  return <Navigate to="/admin/dashboard" replace />;
}
