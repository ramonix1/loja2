'use client';

import type { ComponentProps, ReactNode } from 'react';
import { ChevronsUpDownIcon, LogOutIcon } from 'lucide-react';

import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '../cn';
import type { PanelSurface } from '../surface';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase();
}

export interface NavUserProps {
  surface?: PanelSurface;
  name: string;
  email?: string | null;
  onLogout?: () => void;
  /** Toggle claro/escuro (ThemeIconToggle ou similar). */
  themeToggle?: ReactNode;
  /** Itens extras antes de Sair (ex.: Ver vitrine, Trocar loja). */
  menuItems?: ReactNode;
  className?: string;
}

/** Perfil no rodapé da sidebar — padrão dashboard-01 shadcn. */
export function NavUser({
  surface = 'admin',
  name,
  email,
  onLogout,
  themeToggle,
  menuItems,
  className,
}: NavUserProps) {
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu className={className}>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              data-testid="user-menu-trigger"
            >
              <Avatar className="size-8 shrink-0 rounded-lg group-data-[collapsible=icon]:size-8">
                <AvatarFallback className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  {initials(name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-medium">{name}</span>
                {email ? (
                  <span className="truncate text-xs text-muted-foreground">{email}</span>
                ) : null}
              </div>
              <ChevronsUpDownIcon
                className="ml-auto size-4 group-data-[collapsible=icon]:hidden"
                aria-hidden
              />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'top'}
            align="end"
            sideOffset={4}
            data-ui-surface={surface}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="size-8 rounded-lg">
                  <AvatarFallback className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    {initials(name)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{name}</span>
                  {email ? (
                    <span className="truncate text-xs text-muted-foreground">{email}</span>
                  ) : null}
                </div>
              </div>
            </DropdownMenuLabel>
            {menuItems ? (
              <>
                <DropdownMenuSeparator />
                {menuItems}
              </>
            ) : null}
            {themeToggle ? (
              <>
                <DropdownMenuSeparator />
                <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                  <span className="text-sm text-muted-foreground">Aparência</span>
                  {themeToggle}
                </div>
              </>
            ) : null}
            {onLogout ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={onLogout}
                  data-testid="user-menu-logout"
                >
                  <LogOutIcon className="size-4" aria-hidden />
                  Sair
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

/** Item de menu para uso dentro de NavUser.menuItems. */
export function NavUserMenuItem({
  children,
  className,
  ...props
}: ComponentProps<typeof DropdownMenuItem>) {
  return (
    <DropdownMenuItem className={cn('gap-2', className)} {...props}>
      {children}
    </DropdownMenuItem>
  );
}
