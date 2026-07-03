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
import { AvaliacoesPage } from './routes/admin/avaliacoes/index';
import { LoginPage } from './routes/login';
import { MyStoresPage } from './routes/my-stores';
import { PlatformLoginPage } from './routes/platform-login';
import { PlatformLayout } from './routes/platform/layout';
import { PlatformDashboardPage, PlatformSettingsPlaceholderPage } from './routes/platform/dashboard';
import { PlatformStoresPage } from './routes/platform/stores/index';
import { PlatformStoreNovoPage } from './routes/platform/stores/novo';
import { PlatformStoreDetailPage } from './routes/platform/stores/detail';
import { PlatformMerchantsPage } from './routes/platform/merchants/index';
import { PlatformHealthPage } from './routes/platform/health/index';
import { PlatformReportsPage } from './routes/platform/reports/index';
import { RootRedirect } from './components/root-redirect';

const router = createBrowserRouter([
  { path: '/', element: <RootRedirect /> },
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute role="admin" allowMissingStore />,
    children: [{ path: '/admin/my-stores', element: <MyStoresPage /> }],
  },
  { path: '/platform/login', element: <PlatformLoginPage /> },
  {
    element: <ProtectedRoute role="platform_admin" />,
    children: [
      {
        path: '/platform',
        element: <PlatformLayout />,
        children: [
          { index: true, element: <Navigate to="/platform/dashboard" replace /> },
          { path: 'dashboard', element: <PlatformDashboardPage /> },
          { path: 'settings', element: <PlatformSettingsPlaceholderPage /> },
          { path: 'stores', element: <PlatformStoresPage /> },
          { path: 'stores/novo', element: <PlatformStoreNovoPage /> },
          { path: 'stores/:slug', element: <PlatformStoreDetailPage /> },
          { path: 'merchants', element: <PlatformMerchantsPage /> },
          { path: 'health', element: <PlatformHealthPage /> },
          { path: 'reports', element: <PlatformReportsPage /> },
          { path: 'tenants', element: <Navigate to="/platform/stores" replace /> },
          { path: 'tenants/novo', element: <Navigate to="/platform/stores/novo" replace /> },
          { path: 'tenants/:slug', element: <Navigate to="/platform/stores" replace /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute role="admin" />,
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
          { path: 'avaliacoes', element: <AvaliacoesPage /> },
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
  { path: '*', element: <RootRedirect /> },
]);

export function App() {
  return <RouterProvider router={router} />;
}
