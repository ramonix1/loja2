import { Navigate, createBrowserRouter, RouterProvider } from 'react-router-dom';

import { ProtectedRoute } from './components/protected-route';
import { AdminLayout } from './routes/admin/layout';
import { DashboardPage } from './routes/admin/dashboard';
import { PedidosPage } from './routes/admin/pedidos';
import { LoginPage } from './routes/login';

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/admin/dashboard" replace /> },
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/admin',
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to="/admin/dashboard" replace /> },
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'pedidos', element: <PedidosPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/admin/dashboard" replace /> },
]);

export function App() {
  return <RouterProvider router={router} />;
}
