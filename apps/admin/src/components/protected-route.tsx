import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '../lib/auth-context';

/** Protege rotas `/admin/*`: redireciona para `/login` se não autenticado. */
export function ProtectedRoute() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-400">
        Carregando…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
