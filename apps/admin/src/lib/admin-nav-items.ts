import type { IconType } from '@lojao/ui/icons';
import { NavIcons } from '@lojao/ui/icons';

export type AdminNavChild = {
  to: string;
  label: string;
};

export type AdminNavItem =
  | {
      type: 'link';
      to: string;
      label: string;
      icon: IconType;
    }
  | {
      type: 'expandable';
      label: string;
      icon: IconType;
      children: ReadonlyArray<AdminNavChild>;
    };

export type AdminNavGroup = {
  id: string;
  label: string;
  items: ReadonlyArray<AdminNavItem>;
};

/** Nav agrupada do admin lojista — spec admin-shell-ui §5.5 (P2). */
export const ADMIN_NAV_GROUPS: ReadonlyArray<AdminNavGroup> = [
  {
    id: 'principal',
    label: 'PRINCIPAL',
    items: [
      { type: 'link', to: '/admin/dashboard', label: 'Dashboard', icon: NavIcons.dashboard },
      {
        type: 'expandable',
        label: 'Pedidos',
        icon: NavIcons.pedidos,
        children: [
          { to: '/admin/pedidos', label: 'Todos' },
          { to: '/admin/pedidos?status=pendente', label: 'Pendentes' },
        ],
      },
      { type: 'link', to: '/admin/produtos', label: 'Produtos', icon: NavIcons.produtos },
      { type: 'link', to: '/admin/compradores', label: 'Compradores', icon: NavIcons.compradores },
    ],
  },
  {
    id: 'catalogo',
    label: 'CATÁLOGO',
    items: [
      { type: 'link', to: '/admin/categorias', label: 'Categorias', icon: NavIcons.categorias },
      { type: 'link', to: '/admin/banners', label: 'Banners', icon: NavIcons.banners },
      { type: 'link', to: '/admin/aparencia', label: 'Aparência', icon: NavIcons.aparencia },
      { type: 'link', to: '/admin/avaliacoes', label: 'Avaliações', icon: NavIcons.avaliacoes },
    ],
  },
  {
    id: 'operacao',
    label: 'OPERAÇÃO',
    items: [
      { type: 'link', to: '/admin/agenda', label: 'Agenda', icon: NavIcons.agenda },
      { type: 'link', to: '/admin/chat', label: 'Chat', icon: NavIcons.chat },
      { type: 'link', to: '/admin/relatorios', label: 'Relatórios', icon: NavIcons.relatorios },
    ],
  },
  {
    id: 'loja',
    label: 'LOJA',
    items: [
      { type: 'link', to: '/admin/configuracoes', label: 'Configurações', icon: NavIcons.configuracoes },
      { type: 'link', to: '/admin/permissoes', label: 'Permissões', icon: NavIcons.permissoes },
    ],
  },
];

export type AdminRouteLabels = {
  /** Rota completa (incl. query) → label. */
  routeMap: Map<string, string>;
  /** Base path de item expansível → label do pai (ex.: `/admin/pedidos` → Pedidos). */
  parentMap: Map<string, string>;
};

/** Flatten de rotas → labels para breadcrumbs. */
export function buildAdminRouteLabels(
  groups: ReadonlyArray<AdminNavGroup> = ADMIN_NAV_GROUPS,
): AdminRouteLabels {
  const routeMap = new Map<string, string>();
  const parentMap = new Map<string, string>();

  for (const group of groups) {
    for (const item of group.items) {
      if (item.type === 'link') {
        routeMap.set(item.to, item.label);
      } else {
        const basePath = item.children[0]?.to.split('?')[0];
        if (basePath) {
          parentMap.set(basePath, item.label);
        }
        for (const child of item.children) {
          routeMap.set(child.to, child.label);
        }
      }
    }
  }

  return { routeMap, parentMap };
}

/** Rotas da sidebar platform. @deprecated Use `PLATFORM_NAV_GROUPS` em platform-nav-items.ts */
export const PLATFORM_NAV_ITEMS: ReadonlyArray<{
  to: string;
  label: string;
  icon: IconType;
}> = [{ to: '/platform/stores', label: 'Lojas', icon: NavIcons.relatorios }];
