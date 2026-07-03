export { cn } from './cn';
export { AtaCommerceMark, type AtaCommerceMarkProps } from './brand/ata-commerce-mark';
export { Button, type ButtonProps } from './button';
export {
  IconButton,
  type IconButtonProps,
  type IconButtonSize,
  type IconButtonVariant,
} from './icon-button';
export {
  ThemeIconToggle,
  type ThemeIconToggleProps,
  type UiThemeMode,
} from './theme-icon-toggle';
export { Card, type CardProps } from './card';
export { ChartCard, type ChartCardProps } from './chart-card';
export {
  getChartAxisStyle,
  getChartGridProps,
  getChartTooltipStyle,
  PAYMENT_CHART_COLORS,
  PLATFORM_BILLING_CHART_COLORS,
  PLATFORM_HEALTH_CHART_COLORS,
  PLATFORM_PLAN_CHART_COLORS,
  STATUS_CHART_COLORS,
  useChartTheme,
} from './chart-theme';
export { Table, TableCell, TableHead, TableHeaderCell, TableRow, type TableProps } from './table';
export { Sidebar, SidebarPanel, sidebarShellClass, type SidebarProps } from './sidebar';
export { LayoutAdmin, type LayoutAdminProps, AppShell, type AppShellProps } from './layout-admin';
export { AppHeaderContent, AppBreadcrumb, type AppHeaderContentProps, type AppBreadcrumbProps } from './shell/app-header-content';
export { AppSidebar, type AppSidebarProps } from './shell/app-sidebar';
export { SiteHeader, type SiteHeaderProps } from './shell/site-header';
export { NavMain, type NavMainProps } from './shell/nav-main';
export { NavUser, NavUserMenuItem, type NavUserProps } from './shell/nav-user';
export type {
  ShellNavGroup,
  ShellNavItem,
  ShellNavLinkItem,
  ShellNavExpandableItem,
  ShellNavExternalItem,
  ShellNavChild,
  ShellNavIcon,
} from './shell/shell-nav-types';
export {
  NavGroup,
  NavItem,
  NavItemExpandable,
  NavSubItem,
  shellNavLinkClass,
  type NavGroupProps,
  type NavItemProps,
  type NavItemExpandableProps,
  type NavSubItemProps,
} from './shell/nav-group';
/** @deprecated Preferir `NavUser`. */
export { UserMenu, type UserMenuProps } from './shell/user-menu';
export {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  SidebarRail,
  useSidebar,
} from './components/ui/sidebar';
export { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar';
export {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './components/ui/breadcrumb';
export { Collapsible, CollapsibleContent, CollapsibleTrigger } from './components/ui/collapsible';
export {
  PageToolbar,
  PageToolbarStart,
  PageToolbarEnd,
  type PageToolbarProps,
} from './shell/page-toolbar';
export { KpiStrip, KpiCell, type KpiStripProps, type KpiCellProps } from './shell/kpi-strip';
export { ViewToggle, type ViewToggleProps, type ViewMode } from './shell/view-toggle';
export { PaginationBar, type PaginationBarProps } from './shell/pagination-bar';
export {
  PlatformStoreCard,
  type PlatformStoreCardProps,
  type PlatformStoreHealth,
} from './shell/platform-store-card';
export {
  CommandPalette,
  isCommandPaletteShortcut,
  type CommandPaletteProps,
  type CommandPaletteGroup,
  type CommandPaletteItem,
} from './shell/command-palette';
export {
  NotificationsBell,
  type NotificationsBellProps,
  type NotificationItem,
} from './shell/notifications-bell';
export { Switch, type SwitchProps } from './switch';
export { Badge, badgeVariants } from './components/ui/badge';
export { Input } from './components/ui/input';
export { Label } from './components/ui/label';
export { Skeleton } from './components/ui/skeleton';
export { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
export { Alert, AlertDescription, AlertTitle } from './components/ui/alert';
export { Separator } from './components/ui/separator';
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './components/ui/dialog';
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from './components/ui/select';
export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './components/ui/dropdown-menu';
export { Checkbox } from './components/ui/checkbox';
export { RadioGroup, RadioGroupItem } from './components/ui/radio-group';
export { Textarea } from './components/ui/textarea';
export { ScrollArea, ScrollBar } from './components/ui/scroll-area';
export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './components/ui/sheet';
export { FieldInput, type FieldInputProps } from './field-input';
export { FieldSelect, FieldSelectItem, type FieldSelectProps } from './field-select';
export { FieldTextarea, type FieldTextareaProps } from './field-textarea';
export { FieldNativeSelect, type FieldNativeSelectProps } from './field-native-select';
export {
  FieldRadioGroup,
  FieldRadioGroupItem,
  type FieldRadioGroupProps,
  type FieldRadioGroupItemProps,
} from './field-radio-group';
export { ConfirmDialog, type ConfirmDialogProps } from './confirm-dialog';
export {
  StatusBadge,
  adminStatusBadgeClass,
  statusBadgeClass,
  type StatusBadgeProps,
} from './status-badge';
export {
  DEFAULT_LOJA_COR_PRIMARIA,
  adminEmptyStateClass,
  adminFieldLabelClass,
  adminFileInputClass,
  adminPageSubtitleClass,
  adminPageTitleClass,
  adminPeriodPillClass,
  adminSectionTitleClass,
  adminSegmentedControlClass,
  adminSkeletonBlockClass,
  adminStatValueClass,
  adminStatValueSuccessClass,
} from './admin-styles';
export {
  adminInputClass,
  adminLabelClass,
  adminMutedClass,
  adminNavLinkClass,
  adminShellClass,
  adminSidebarLinkClass,
  adminSubtleClass,
  authCardClass,
  authShellClass,
  merchantHubShellClass,
  platformInputClass,
  platformAuthCardClass,
  platformAuthShellClass,
  platformLabelClass,
  platformMutedClass,
  platformNavLinkClass,
  platformSidebarLinkClass,
  platformSubtleClass,
  storeInputClass,
  resolveSurface,
  surfaceVar,
  type SidebarTheme,
  type UiSurface,
} from './surface';
