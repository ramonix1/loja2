import {
  LayoutAdmin,
  SidebarPanel,
  platformNavLinkClass,
  platformSidebarLinkClass,
  cn,
} from '@lojao/ui';
import { testIds } from '@lojao/test-utils';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { PlatformUiThemeSwitch } from '../../components/platform-ui-theme-switch';
import { usePlatformUiTheme } from '../../lib/platform-ui-theme';
import { useAuth } from '../../lib/auth-context';

const NAV_ITEMS = [{ to: '/platform/tenants', label: 'Lojas' }];

export function PlatformLayout() {
  const { user, logout } = useAuth();
  const { theme: uiTheme } = usePlatformUiTheme();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  function renderSidebar(closeMobileMenu: () => void) {
    return (
      <SidebarPanel
        surface="platform"
        title={
          <span>
            <span className="font-extrabold">Ata</span>
            <span className="font-normal text-[var(--platform-sidebar-muted)]">Labs</span>
            <span className="text-[var(--platform-accent)]">·</span>
          </span>
        }
        subtitle="Platform Hub"
        navTestId={testIds.platform.sidebarNav}
        footer={
          <>
            <PlatformUiThemeSwitch />
            <div className="px-3 py-2 text-xs text-[var(--platform-sidebar-muted)]">{user?.nome}</div>
            <button
              type="button"
              onClick={() => {
                closeMobileMenu();
                void handleLogout();
              }}
              className={cn(
                platformSidebarLinkClass(false),
                'text-[var(--platform-error)] hover:bg-[var(--platform-error-bg)] hover:text-[var(--platform-error)]',
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
            className={({ isActive }) => platformNavLinkClass(isActive)}
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
      mobileMenuTestId={testIds.platform.mobileMenuBtn}
      surface="platform"
      uiMode={uiTheme}
    >
      <Outlet />
    </LayoutAdmin>
  );
}
