/**
 * Barrel de ícones de produto (`@lojao/ui/icons`).
 *
 * Regra (spec dark-theme-icons §4.3): apps importam ícones SEMPRE deste
 * barrel, nunca de `react-icons/hi2` direto. Tree-shaking preservado por
 * reexport nomeado. `lucide-react` permanece restrito aos primitivos shadcn.
 */
import type { IconType } from 'react-icons';
import {
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineArrowRightOnRectangle,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineBars3,
  HiOutlineBuildingStorefront,
  HiOutlineCalendar,
  HiOutlineChartBar,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCheck,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineClipboardDocumentList,
  HiOutlineCog6Tooth,
  HiOutlineCube,
  HiOutlineEye,
  HiOutlineHome,
  HiOutlineMinus,
  HiOutlineMoon,
  HiOutlinePaintBrush,
  HiOutlinePencil,
  HiOutlinePhoto,
  HiOutlinePlus,
  HiOutlineShieldCheck,
  HiOutlineShoppingBag,
  HiOutlineShoppingCart,
  HiOutlineSun,
  HiOutlineTag,
  HiOutlineTrash,
  HiOutlineUsers,
  HiOutlineXMark,
} from 'react-icons/hi2';

export type { IconType };

export {
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineArrowRightOnRectangle,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineBars3,
  HiOutlineBuildingStorefront,
  HiOutlineCalendar,
  HiOutlineChartBar,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCheck,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineClipboardDocumentList,
  HiOutlineCog6Tooth,
  HiOutlineCube,
  HiOutlineEye,
  HiOutlineHome,
  HiOutlineMinus,
  HiOutlineMoon,
  HiOutlinePaintBrush,
  HiOutlinePencil,
  HiOutlinePhoto,
  HiOutlinePlus,
  HiOutlineShieldCheck,
  HiOutlineShoppingBag,
  HiOutlineShoppingCart,
  HiOutlineSun,
  HiOutlineTag,
  HiOutlineTrash,
  HiOutlineUsers,
  HiOutlineXMark,
};

/**
 * Aliases semânticos (ação → ícone) conforme mapa §4.3 da spec.
 * Use estes nas apps para desacoplar a UI do nome concreto da lib.
 */
export const ActionIcons = {
  delete: HiOutlineTrash,
  edit: HiOutlinePencil,
  view: HiOutlineEye,
  add: HiOutlinePlus,
  save: HiOutlineCheck,
  close: HiOutlineXMark,
  back: HiOutlineArrowLeft,
  forward: HiOutlineArrowRight,
  logout: HiOutlineArrowRightOnRectangle,
  externalLink: HiOutlineArrowTopRightOnSquare,
  menu: HiOutlineBars3,
  themeLight: HiOutlineSun,
  themeDark: HiOutlineMoon,
  switchStore: HiOutlineBuildingStorefront,
  prev: HiOutlineChevronLeft,
  next: HiOutlineChevronRight,
  minus: HiOutlineMinus,
  plus: HiOutlinePlus,
} satisfies Record<string, IconType>;

/** Ícones de navegação (sidebar admin/platform + store nav) — mapa §4.3. */
export const NavIcons = {
  dashboard: HiOutlineHome,
  categorias: HiOutlineTag,
  produtos: HiOutlineCube,
  pedidos: HiOutlineShoppingBag,
  configuracoes: HiOutlineCog6Tooth,
  relatorios: HiOutlineChartBar,
  permissoes: HiOutlineShieldCheck,
  chat: HiOutlineChatBubbleLeftRight,
  agenda: HiOutlineCalendar,
  banners: HiOutlinePhoto,
  aparencia: HiOutlinePaintBrush,
  compradores: HiOutlineUsers,
  cart: HiOutlineShoppingCart,
  orders: HiOutlineClipboardDocumentList,
} satisfies Record<string, IconType>;
