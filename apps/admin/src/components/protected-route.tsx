import { adminMutedClass, cn } from '@lojao/ui';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../lib/auth-context';

interface ProtectedRouteProps {
  /** Papel exigido. `admin` = lojista; `platform_admin` = operador Ata Labs. */
  role?: 'admin' | 'platform_admin';
  /** Permite admin autenticado sem loja selecionada (Merchant Hub). */
  allowMissingStore?: boolean;
}

/**
 * Protege rotas autenticadas. Sem sessão → `/login`.
 * Com `role`, redireciona quem tem o papel oposto para a sua home.
 */
export function ProtectedRoute({
  role,
  allowMissingStore = false,
}: ProtectedRouteProps = {}) {
  const { isLoading, isAuthenticated, isPlatformAdmin, needsStoreSelection } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className={cn('flex min-h-screen items-center justify-center', adminMutedClass())}>
        Carregando…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (role === 'platform_admin' && !isPlatformAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (role === 'admin' && isPlatformAdmin) {
    return <Navigate to="/platform/stores" replace />;
  }

  if (role === 'admin' && needsStoreSelection && !allowMissingStore) {
    return <Navigate to="/admin/my-stores" replace />;
  }

  return <Outlet />;
}
