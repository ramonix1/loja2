import {
  AppShell,
  AppSidebar,
  CommandPalette,
  NavUser,
  NavUserMenuItem,
  NotificationsBell,
  SiteHeader,
  isCommandPaletteShortcut,
  type CommandPaletteGroup,
  type NotificationItem,
  type ShellNavGroup,
} from '@lojao/ui';
import type { IconType } from '@lojao/ui/icons';
import { ActionIcons, NavIcons } from '@lojao/ui/icons';
import { testIds } from '@lojao/test-utils';
import { useQuery } from '@tanstack/react-query';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';

import { AdminUiThemeSwitch } from '../../components/admin-ui-theme-switch';
import {
  ADMIN_NAV_GROUPS,
  buildAdminRouteLabels,
} from '../../lib/admin-nav-items';
import { apiFetch, storefrontHomeUrl } from '../../lib/api-client';
import { useAuth } from '../../lib/auth-context';

const ADMIN_ROUTE_LABELS = buildAdminRouteLabels();

function commandNavIcon(Icon: IconType) {
  return <Icon className="size-4 shrink-0" aria-hidden />;
}

function AdminBreadcrumbs() {
  const location = useLocation();
  const { routeMap, parentMap } = ADMIN_ROUTE_LABELS;
  const fullPath = location.pathname + location.search;
  const segments = location.pathname.replace(/^\/admin\/?/, '').split('/').filter(Boolean);

  const items: Array<{ label: string; to?: string }> = [
    { label: 'Admin', to: '/admin/dashboard' },
  ];

  if (segments.length === 0 || segments[0] === 'dashboard') {
    items.push({ label: 'Dashboard' });
  } else {
    const firstSeg = segments[0]!;
    const basePath = `/admin/${firstSeg}`;
    const queryLabel = routeMap.get(fullPath);

    if (segments.length === 1 && queryLabel && fullPath !== basePath) {
      const parentLabel = parentMap.get(basePath) ?? routeMap.get(basePath) ?? firstSeg;
      items.push({ label: parentLabel, to: basePath });
      items.push({ label: queryLabel });
    } else if (segments.length === 1) {
      const label =
        routeMap.get(fullPath) ??
        parentMap.get(basePath) ??
        routeMap.get(basePath) ??
        firstSeg.charAt(0).toUpperCase() + firstSeg.slice(1);
      items.push({ label });
    } else {
      const parentLabel =
        parentMap.get(basePath) ??
        routeMap.get(basePath) ??
        firstSeg.charAt(0).toUpperCase() + firstSeg.slice(1);
      items.push({ label: parentLabel, to: basePath });

      const second = segments[1]!;
      if (second === 'novo') {
        items.push({ label: 'Novo' });
      } else if (/^\d+$/.test(second)) {
        items.push({ label: `#${second}` });
      } else {
        items.push({ label: second.charAt(0).toUpperCase() + second.slice(1) });
      }
    }
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

function adminPageTitle(pathname: string, search: string): string {
  const fullPath = pathname + search;
  const segments = pathname.replace(/^\/admin\/?/, '').split('/').filter(Boolean);
  const { routeMap, parentMap } = ADMIN_ROUTE_LABELS;

  if (segments.length === 0 || segments[0] === 'dashboard') {
    return 'Dashboard';
  }

  const basePath = `/admin/${segments[0]}`;
  const queryLabel = routeMap.get(fullPath);
  if (segments.length === 1 && queryLabel) {
    return queryLabel;
  }
  if (segments.length === 1) {
    return (
      routeMap.get(basePath) ??
      parentMap.get(basePath) ??
      segments[0]!.charAt(0).toUpperCase() + segments[0]!.slice(1)
    );
  }

  const second = segments[1]!;
  if (second === 'novo') return 'Novo';
  if (/^\d+$/.test(second)) return `#${second}`;
  return second.charAt(0).toUpperCase() + second.slice(1);
}

function buildCommandGroups(
  navigate: ReturnType<typeof useNavigate>,
): ReadonlyArray<CommandPaletteGroup> {
  const groups: CommandPaletteGroup[] = ADMIN_NAV_GROUPS.map((group) => ({
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
      return item.children.map((child) => ({
        id: child.to,
        label: `${item.label} · ${child.label}`,
        icon: commandNavIcon(item.icon),
        onSelect: () => navigate(child.to),
      }));
    }),
  }));

  groups.unshift({
    id: 'acoes-rapidas',
    heading: 'AÇÕES RÁPIDAS',
    items: [
      {
        id: 'novo-produto',
        label: 'Criar produto',
        icon: commandNavIcon(NavIcons.produtos),
        onSelect: () => navigate('/admin/produtos'),
      },
      {
        id: 'pedidos-pendentes',
        label: 'Ver pedidos pendentes',
        icon: commandNavIcon(NavIcons.pedidos),
        onSelect: () => navigate('/admin/pedidos?status=pendente'),
      },
    ],
  });

  return groups;
}

interface AdminNotificationsStats {
  pedidos_pendentes: number;
}

export function AdminLayout() {
  const { user, store, logout, impersonation, endImpersonation } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [commandOpen, setCommandOpen] = useState(false);

  const ExternalLinkIcon = ActionIcons.externalLink;
  const SwitchStoreIcon = ActionIcons.switchStore;

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
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: () =>
      apiFetch<{ data: AdminNotificationsStats }>('/api/v1/admin/dashboard/stats').then(
        (r) => r.data,
      ),
  });

  const notifications = useMemo<NotificationItem[]>(() => {
    if (!dashboardStats || dashboardStats.pedidos_pendentes <= 0) return [];
    return [
      {
        id: 'pedidos-pendentes',
        title: `${dashboardStats.pedidos_pendentes} pedido(s) pendente(s)`,
        description: 'Aguardando pagamento ou confirmação.',
        href: '/admin/pedidos?status=pendente',
      },
    ];
  }, [dashboardStats]);

  const vitrineUrl = store ? storefrontHomeUrl(store.slug) : undefined;
  const pageTitle = useMemo(
    () => adminPageTitle(location.pathname, location.search),
    [location.pathname, location.search],
  );

  const impersonationBanner = impersonation ? (
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
  ) : null;

  return (
    <>
      <AppShell
        surface="admin"
        sidebar={
          <AppSidebar
            surface="admin"
            brand={
              <span>
                <span className="font-extrabold">Ata</span>
                <span className="font-normal text-[var(--admin-sidebar-muted)]">Commerce</span>
                <span className="text-[var(--admin-accent-hover)]">·</span>
              </span>
            }
            subtitle={store?.lojaNome ?? 'Painel Admin'}
            searchPlaceholder="Buscar pedido, produto…"
            onSearchClick={() => setCommandOpen(true)}
            navTestId={testIds.admin.sidebarNav}
            groups={ADMIN_NAV_GROUPS as ReadonlyArray<ShellNavGroup>}
            footer={
              <NavUser
                surface="admin"
                name={user?.nome ?? 'Admin'}
                email={user?.email}
                onLogout={() => void handleLogout()}
                themeToggle={<AdminUiThemeSwitch inset />}
                menuItems={
                  <>
                    {vitrineUrl ? (
                      <NavUserMenuItem asChild>
                        <a
                          href={vitrineUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-testid={testIds.admin.viewStorefront}
                        >
                          <ExternalLinkIcon className="size-4" aria-hidden />
                          Ver vitrine
                        </a>
                      </NavUserMenuItem>
                    ) : null}
                    <NavUserMenuItem asChild>
                      <NavLink to="/admin/my-stores" data-testid={testIds.merchantHub.switchStore}>
                        <SwitchStoreIcon className="size-4" aria-hidden />
                        Trocar loja
                      </NavLink>
                    </NavUserMenuItem>
                  </>
                }
              />
            }
          />
        }
        header={
          <SiteHeader
            breadcrumbs={<AdminBreadcrumbs />}
            title={pageTitle}
            mobileMenuTestId={testIds.admin.mobileMenuBtn}
            actions={<NotificationsBell surface="admin" items={notifications} />}
          />
        }
        banner={impersonationBanner}
      >
        <Outlet />
      </AppShell>
      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        groups={commandGroups}
        surface="admin"
        placeholder="Buscar pedido, produto, página…"
      />
    </>
  );
}
