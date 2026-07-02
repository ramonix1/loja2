import {
  LayoutAdmin,
  SidebarPanel,
  adminNavLinkClass,
  adminSidebarLinkClass,
  cn,
} from '@lojao/ui';
import { ActionIcons } from '@lojao/ui/icons';
import { testIds } from '@lojao/test-utils';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { AdminUiThemeSwitch } from '../../components/admin-ui-theme-switch';
import { ADMIN_NAV_ITEMS } from '../../lib/admin-nav-items';
import { storefrontHomeUrl } from '../../lib/api-client';
import { useAdminUiTheme } from '../../lib/admin-ui-theme';
import { useAuth } from '../../lib/auth-context';

export function AdminLayout() {
  const { user, store, logout, impersonation, endImpersonation } = useAuth();
  const { theme: uiTheme } = useAdminUiTheme();
  const navigate = useNavigate();

  const LogoutIcon = ActionIcons.logout;
  const ExternalLinkIcon = ActionIcons.externalLink;
  const SwitchStoreIcon = ActionIcons.switchStore;

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const vitrineUrl = store ? storefrontHomeUrl(store.slug) : undefined;

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
        subtitle={store?.lojaNome ?? 'Painel Admin'}
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
                <ExternalLinkIcon className="size-5 shrink-0" aria-hidden />
                Ver vitrine
              </a>
            )}
            <NavLink
              to="/admin/my-stores"
              data-testid={testIds.merchantHub.switchStore}
              className={({ isActive }) => adminSidebarLinkClass(isActive)}
              onClick={closeMobileMenu}
            >
              <SwitchStoreIcon className="size-5 shrink-0" aria-hidden />
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
              <LogoutIcon className="size-5 shrink-0" aria-hidden />
              Sair
            </button>
          </>
        }
      >
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={closeMobileMenu}
              className={({ isActive }) => adminNavLinkClass(isActive)}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              {item.label}
            </NavLink>
          );
        })}
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
      {impersonation ? (
        <div
          className="border-b border-amber-500/40 bg-amber-500/15 px-4 py-2 text-sm text-[var(--admin-text)]"
          data-testid="admin-impersonation-banner"
        >
          Modo suporte — loja <strong>{impersonation.storeSlug}</strong> (operador:{' '}
          {impersonation.operatorEmail}).{' '}
          <button
            type="button"
            className="font-semibold underline"
            onClick={() => void endImpersonation()}
          >
            Sair da impersonação
          </button>
        </div>
      ) : null}
      <Outlet />
    </LayoutAdmin>
  );
}
