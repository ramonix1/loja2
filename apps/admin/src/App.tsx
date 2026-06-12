import { Navigate, createBrowserRouter, RouterProvider } from 'react-router-dom';

import { ProtectedRoute } from './components/protected-route';
import { AdminLayout } from './routes/admin/layout';
import { AparenciaPage } from './routes/admin/aparencia/index';
import { BannersPage } from './routes/admin/banners/index';
import { BannerFormPage } from './routes/admin/banners/form';
import { CategoriasPage } from './routes/admin/categorias/index';
import { CategoriaEditPage } from './routes/admin/categorias/edit';
import { DashboardPage } from './routes/admin/dashboard';
import { CompradoresPage } from './routes/admin/compradores/index';
import { CompradorDetailPage } from './routes/admin/compradores/detail';
import { ConfiguracoesPage } from './routes/admin/configuracoes/index';
import { PedidosPage } from './routes/admin/pedidos';
import { PedidoDetailPage } from './routes/admin/pedidos/detail';
import { ProdutosPage } from './routes/admin/produtos/index';
import { ProdutoEditPage } from './routes/admin/produtos/edit';
import { RelatoriosPage } from './routes/admin/relatorios/index';
import { AgendaPage } from './routes/admin/agenda/index';
import { PermissoesPage } from './routes/admin/permissoes/index';
import { ChatPage } from './routes/admin/chat/index';
import { DiagnosticoPage } from './routes/admin/diagnostico/index';
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
          { path: 'pedidos/:id', element: <PedidoDetailPage /> },
          { path: 'categorias', element: <CategoriasPage /> },
          { path: 'categorias/:id', element: <CategoriaEditPage /> },
          { path: 'banners', element: <BannersPage /> },
          { path: 'banners/novo', element: <BannerFormPage /> },
          { path: 'banners/:id', element: <BannerFormPage /> },
          { path: 'aparencia', element: <AparenciaPage /> },
          { path: 'produtos', element: <ProdutosPage /> },
          { path: 'produtos/:id', element: <ProdutoEditPage /> },
          { path: 'compradores', element: <CompradoresPage /> },
          { path: 'compradores/:id', element: <CompradorDetailPage /> },
          { path: 'configuracoes', element: <ConfiguracoesPage /> },
          { path: 'relatorios', element: <RelatoriosPage /> },
          { path: 'agenda', element: <AgendaPage /> },
          { path: 'permissoes', element: <PermissoesPage /> },
          { path: 'chat', element: <ChatPage /> },
          { path: 'diagnostico', element: <DiagnosticoPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/admin/dashboard" replace /> },
]);

export function App() {
  return <RouterProvider router={router} />;
}
