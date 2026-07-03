import type { IconType } from '@lojao/ui/icons';
import { NavIcons } from '@lojao/ui/icons';

export type PlatformNavChild = {
  to: string;
  label: string;
};

export type PlatformNavItem =
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
      children: ReadonlyArray<PlatformNavChild>;
    }
  | {
      type: 'external';
      href: string;
      label: string;
      icon: IconType;
    };

export type PlatformNavGroup = {
  id: string;
  label: string;
  items: ReadonlyArray<PlatformNavItem>;
};

/** Nav agrupada do Platform Hub — spec admin-shell-ui §5.4 (P1). */
export const PLATFORM_NAV_GROUPS: ReadonlyArray<PlatformNavGroup> = [
  {
    id: 'principal',
    label: 'PRINCIPAL',
    items: [
      { type: 'link', to: '/platform/dashboard', label: 'Dashboard', icon: NavIcons.dashboard },
      {
        type: 'expandable',
        label: 'Lojas',
        icon: NavIcons.relatorios,
        children: [
          { to: '/platform/stores', label: 'Todas' },
          { to: '/platform/stores?status=suspended', label: 'Suspensas' },
          { to: '/platform/stores/novo', label: 'Nova loja' },
        ],
      },
      { type: 'link', to: '/platform/merchants', label: 'Merchants', icon: NavIcons.merchants },
    ],
  },
  {
    id: 'analytics',
    label: 'ANALYTICS',
    items: [
      { type: 'link', to: '/platform/reports', label: 'Relatórios', icon: NavIcons.relatorios },
      { type: 'link', to: '/platform/health', label: 'Saúde / Logs', icon: NavIcons.permissoes },
    ],
  },
  {
    id: 'sistema',
    label: 'SISTEMA',
    items: [
      { type: 'link', to: '/platform/settings', label: 'Configurações', icon: NavIcons.configuracoes },
      {
        type: 'external',
        href: 'https://docs.atacommerce.com.br',
        label: 'Ajuda',
        icon: NavIcons.chat,
      },
    ],
  },
];
