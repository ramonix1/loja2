import { LayoutAdmin, Sidebar, cn } from '@lojao/ui';
import { testIds } from '@lojao/test-utils';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { useAuth } from '../../lib/auth-context';

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/categorias', label: 'Categorias' },
  { to: '/admin/banners', label: 'Banners' },
  { to: '/admin/aparencia', label: 'Aparência' },
  { to: '/admin/produtos', label: 'Produtos' },
  { to: '/admin/compradores', label: 'Compradores' },
  { to: '/admin/pedidos', label: 'Pedidos' },
  { to: '/admin/configuracoes', label: 'Configurações' },
  { to: '/admin/relatorios', label: 'Relatórios' },
  { to: '/admin/agenda', label: 'Agenda' },
  { to: '/admin/permissoes', label: 'Permissões' },
  { to: '/admin/chat', label: 'Chat' },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const sidebar = (
    <Sidebar
      title="Lojão"
      subtitle="Painel Admin"
      navTestId={testIds.admin.sidebarNav}
      footer={
        <>
          <div className="px-3 py-2 text-xs text-gray-500">{user?.nome}</div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-400 transition hover:bg-gray-800 hover:text-red-300"
          >
            Sair
          </button>
        </>
      }
    >
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white',
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </Sidebar>
  );

  return (
    <LayoutAdmin sidebar={sidebar}>
      <Outlet />
    </LayoutAdmin>
  );
}
