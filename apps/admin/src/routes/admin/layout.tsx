import {
  LayoutAdmin,
  SidebarPanel,
  adminNavLinkClass,
  adminSidebarLinkClass,
  cn,
} from '@lojao/ui';
import { testIds } from '@lojao/test-utils';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { AdminUiThemeSwitch } from '../../components/admin-ui-theme-switch';
import { storefrontHomeUrl } from '../../lib/api-client';
import { useAdminUiTheme } from '../../lib/admin-ui-theme';
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
  const { user, tenant, logout } = useAuth();
  const { theme: uiTheme } = useAdminUiTheme();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const vitrineUrl = tenant ? storefrontHomeUrl(tenant.slug) : undefined;

  function renderSidebar(closeMobileMenu: () => void) {
    return (
      <SidebarPanel
        surface="admin"
        title={
          <span>
            <span className="font-extrabold">Ata</span>
            <span className="font-normal text-[var(--admin-sidebar-muted)]">Commerce</span>
            <span className="text-[var(--admin-accent-hover)]">·</span>
          </span>
        }
        subtitle={tenant?.lojaNome ?? 'Painel Admin'}
        navTestId={testIds.admin.sidebarNav}
        footer={
          <>
            <AdminUiThemeSwitch />
            {vitrineUrl && (
              <a
                href={vitrineUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid={testIds.admin.viewStorefront}
                className={cn(
                  adminSidebarLinkClass(false),
                  'text-[var(--admin-link)] hover:text-[var(--admin-link-hover)]',
                )}
              >
                Ver vitrine
              </a>
            )}
            <NavLink
              to="/admin/my-stores"
              data-testid={testIds.merchantHub.switchStore}
              className={({ isActive }) => adminSidebarLinkClass(isActive)}
              onClick={closeMobileMenu}
            >
              Trocar loja
            </NavLink>
            <div className="px-3 py-2 text-xs text-[var(--admin-sidebar-muted)]">{user?.nome}</div>
            <button
              type="button"
              onClick={() => {
                closeMobileMenu();
                void handleLogout();
              }}
              className={cn(
                adminSidebarLinkClass(false),
                'text-[var(--admin-error)] hover:bg-[var(--admin-error-bg)] hover:text-[var(--admin-error-text)]',
              )}
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
            onClick={closeMobileMenu}
            className={({ isActive }) => adminNavLinkClass(isActive)}
          >
            {item.label}
          </NavLink>
        ))}
      </SidebarPanel>
    );
  }

  return (
    <LayoutAdmin
      renderSidebar={renderSidebar}
      mobileMenuTestId={testIds.admin.mobileMenuBtn}
      surface="admin"
      uiMode={uiTheme}
    >
      <Outlet />
    </LayoutAdmin>
  );
}
