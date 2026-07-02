import type { IconType } from '@lojao/ui/icons';
import { NavIcons } from '@lojao/ui/icons';

/** Rotas da sidebar admin — mapa §4.3 da spec dark-theme-icons. */
export const ADMIN_NAV_ITEMS: ReadonlyArray<{
  to: string;
  label: string;
  icon: IconType;
}> = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: NavIcons.dashboard },
  { to: '/admin/categorias', label: 'Categorias', icon: NavIcons.categorias },
  { to: '/admin/banners', label: 'Banners', icon: NavIcons.banners },
  { to: '/admin/aparencia', label: 'Aparência', icon: NavIcons.aparencia },
  { to: '/admin/produtos', label: 'Produtos', icon: NavIcons.produtos },
  { to: '/admin/compradores', label: 'Compradores', icon: NavIcons.compradores },
  { to: '/admin/pedidos', label: 'Pedidos', icon: NavIcons.pedidos },
  { to: '/admin/configuracoes', label: 'Configurações', icon: NavIcons.configuracoes },
  { to: '/admin/relatorios', label: 'Relatórios', icon: NavIcons.relatorios },
  { to: '/admin/agenda', label: 'Agenda', icon: NavIcons.agenda },
  { to: '/admin/permissoes', label: 'Permissões', icon: NavIcons.permissoes },
  { to: '/admin/chat', label: 'Chat', icon: NavIcons.chat },
];

/** Rotas da sidebar platform. */
export const PLATFORM_NAV_ITEMS: ReadonlyArray<{
  to: string;
  label: string;
  icon: IconType;
}> = [{ to: '/platform/stores', label: 'Lojas', icon: NavIcons.relatorios }];
