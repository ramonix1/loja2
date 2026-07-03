import {
  AppShell,
  AppSidebar,
  CommandPalette,
  NavUser,
  NotificationsBell,
  SiteHeader,
  isCommandPaletteShortcut,
  type CommandPaletteGroup,
  type NotificationItem,
  type ShellNavGroup,
} from '@lojao/ui';
import { testIds } from '@lojao/test-utils';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link, Outlet, useLocation, useMatch, useNavigate } from 'react-router-dom';

import { PlatformUiThemeSwitch } from '../../components/platform-ui-theme-switch';
import { PLATFORM_NAV_GROUPS } from '../../lib/platform-nav-items';
import { getPlatformDashboardStats } from '../../lib/platform-api';
import { useAuth } from '../../lib/auth-context';
import type { IconType } from '@lojao/ui/icons';
import { ActionIcons, NavIcons } from '@lojao/ui/icons';

function commandNavIcon(Icon: IconType) {
  return <Icon className="size-4 shrink-0" aria-hidden />;
}

function PlatformBreadcrumbs() {
  const location = useLocation();
  const dashboardMatch = useMatch('/platform/dashboard');
  const storesMatch = useMatch('/platform/stores');
  const storeDetailMatch = useMatch('/platform/stores/:slug');
  const merchantsMatch = useMatch('/platform/merchants');
  const healthMatch = useMatch('/platform/health');
  const reportsMatch = useMatch('/platform/reports');
  const settingsMatch = useMatch('/platform/settings');
  const novoMatch = useMatch('/platform/stores/novo');

  const items: Array<{ label: string; to?: string }> = [{ label: 'Platform', to: '/platform/dashboard' }];

  if (dashboardMatch) {
    items.push({ label: 'Dashboard' });
  } else if (novoMatch) {
    items.push({ label: 'Lojas', to: '/platform/stores' });
    items.push({ label: 'Nova loja' });
  } else if (storeDetailMatch?.params.slug) {
    items.push({ label: 'Lojas', to: '/platform/stores' });
    items.push({ label: storeDetailMatch.params.slug });
  } else if (storesMatch) {
    items.push({ label: 'Lojas' });
  } else if (merchantsMatch) {
    items.push({ label: 'Merchants' });
  } else if (healthMatch) {
    items.push({ label: 'Saúde / Logs' });
  } else if (reportsMatch) {
    items.push({ label: 'Relatórios' });
  } else if (settingsMatch) {
    items.push({ label: 'Configurações' });
  } else {
    items.push({ label: location.pathname.split('/').pop() ?? 'Painel' });
  }

  return (
    <ol className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm text-[var(--shell-text-muted)]">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
            {index > 0 ? <span aria-hidden>/</span> : null}
            {item.to && !isLast ? (
              <Link to={item.to} className="truncate hover:text-[var(--shell-text)] hover:underline">
                {item.label}
              </Link>
            ) : (
              <span
                className={isLast ? 'truncate font-medium text-[var(--shell-text)]' : 'truncate'}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function buildCommandGroups(
  navigate: ReturnType<typeof useNavigate>,
): ReadonlyArray<CommandPaletteGroup> {
  const groups: CommandPaletteGroup[] = PLATFORM_NAV_GROUPS.map((group) => ({
    id: group.id,
    heading: group.label,
    items: group.items.flatMap((item) => {
      if (item.type === 'link') {
        return [
          {
            id: item.to,
            label: item.label,
            icon: commandNavIcon(item.icon),
            onSelect: () => navigate(item.to),
          },
        ];
      }
      if (item.type === 'expandable') {
        return item.children.map((child) => ({
          id: child.to,
          label: `${item.label} · ${child.label}`,
          icon: commandNavIcon(item.icon),
          onSelect: () => navigate(child.to),
        }));
      }
      return [
        {
          id: item.href,
          label: item.label,
          icon: commandNavIcon(item.icon),
          onSelect: () => {
            window.open(item.href, '_blank', 'noopener,noreferrer');
          },
        },
      ];
    }),
  }));

  groups.unshift({
    id: 'acoes-rapidas',
    heading: 'AÇÕES RÁPIDAS',
    items: [
      {
        id: 'nova-loja',
        label: 'Criar nova loja',
        icon: commandNavIcon(ActionIcons.add),
        onSelect: () => navigate('/platform/stores/novo'),
      },
      {
        id: 'ver-suspensas',
        label: 'Ver lojas suspensas',
        icon: commandNavIcon(NavIcons.permissoes),
        onSelect: () => navigate('/platform/stores?status=suspended'),
      },
    ],
  });

  return groups;
}

export function PlatformLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [commandOpen, setCommandOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (isCommandPaletteShortcut(event)) {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
    }
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  const commandGroups = useMemo(() => buildCommandGroups(navigate), [navigate]);

  const { data: dashboardStats } = useQuery({
    queryKey: ['platform', 'dashboard', 'stats'],
    queryFn: getPlatformDashboardStats,
  });

  const notifications = useMemo<NotificationItem[]>(() => {
    if (!dashboardStats) return [];
    const items: NotificationItem[] = [];
    if (dashboardStats.suspendedStores > 0) {
      items.push({
        id: 'suspended-stores',
        title: `${dashboardStats.suspendedStores} loja(s) suspensa(s)`,
        description: 'Revise merchants ou lojas com pagamento/plano pendente.',
        href: '/platform/stores?status=suspended',
      });
    }
    if (dashboardStats.newStores30d > 0) {
      items.push({
        id: 'new-stores',
        title: `${dashboardStats.newStores30d} nova(s) loja(s) nos últimos 30 dias`,
        description: 'Acompanhe onboarding e ative billing.',
        href: '/platform/stores',
      });
    }
    return items;
  }, [dashboardStats]);

  const pageTitle =
    location.pathname.startsWith('/platform/dashboard')
      ? 'Dashboard'
      : location.pathname.startsWith('/platform/stores')
        ? 'Lojas'
        : location.pathname.startsWith('/platform/merchants')
          ? 'Merchants'
          : location.pathname.startsWith('/platform/health')
            ? 'Saúde / Logs'
            : location.pathname.startsWith('/platform/reports')
              ? 'Relatórios'
              : location.pathname.startsWith('/platform/settings')
                ? 'Configurações'
                : 'Platform';

  return (
    <>
      <AppShell
        surface="platform"
        sidebar={
          <AppSidebar
            surface="platform"
            brand={
              <span>
                <span className="font-extrabold">Ata</span>
                <span className="font-normal text-[var(--platform-sidebar-muted)]">Labs</span>
                <span className="text-[var(--platform-accent)]">·</span>
              </span>
            }
            subtitle="Platform Ops"
            searchPlaceholder="Buscar loja, merchant…"
            onSearchClick={() => setCommandOpen(true)}
            navTestId={testIds.platform.sidebarNav}
            groups={PLATFORM_NAV_GROUPS as ReadonlyArray<ShellNavGroup>}
            footer={
              <NavUser
                surface="platform"
                name={user?.nome ?? 'Operador'}
                email={user?.email}
                onLogout={() => void handleLogout()}
                themeToggle={<PlatformUiThemeSwitch inset />}
              />
            }
          />
        }
        header={
          <SiteHeader
            breadcrumbs={<PlatformBreadcrumbs />}
            title={pageTitle}
            mobileMenuTestId={testIds.platform.mobileMenuBtn}
            actions={<NotificationsBell surface="platform" items={notifications} />}
          />
        }
      >
        <Outlet />
      </AppShell>
      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        groups={commandGroups}
        surface="platform"
        placeholder="Buscar loja, merchant, página…"
      />
    </>
  );
}
