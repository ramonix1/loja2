'use client';

import type { ReactNode } from 'react';

import { AtaCommerceMark } from '../brand/ata-commerce-mark';
import { ActionIcons } from '../icons';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { cn } from '../cn';
import type { PanelSurface } from '../surface';
import { NavMain, type NavMainProps } from './nav-main';

export interface AppSidebarProps extends NavMainProps {
  surface?: PanelSurface;
  brand: ReactNode;
  subtitle?: ReactNode;
  searchPlaceholder?: string;
  onSearchClick?: () => void;
  navTestId?: string;
  footer?: ReactNode;
  className?: string;
}

/** Sidebar shadcn (dashboard-01) — brand, busca ⌘K, nav agrupada, footer. */
export function AppSidebar({
  brand,
  subtitle,
  searchPlaceholder = 'Buscar…',
  onSearchClick,
  navTestId,
  groups,
  onNavigate,
  footer,
  className,
}: AppSidebarProps) {
  const SearchIcon = ActionIcons.search;

  return (
    <Sidebar variant="inset" collapsible="icon" className={className} data-testid="app-sidebar">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pointer-events-none">
              <AtaCommerceMark />
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold text-sidebar-foreground">{brand}</span>
                {subtitle != null ? (
                  <span className="truncate text-xs text-muted-foreground">{subtitle}</span>
                ) : null}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={searchPlaceholder}
              onClick={onSearchClick}
              data-testid="sidebar-search-trigger"
            >
              <SearchIcon className="size-4 shrink-0" aria-hidden />
              <span className="truncate text-muted-foreground group-data-[collapsible=icon]:hidden">
                {searchPlaceholder}
              </span>
              <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[0.625rem] font-medium text-muted-foreground group-data-[collapsible=icon]:hidden sm:flex">
                ⌘K
              </kbd>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent data-testid={navTestId}>
        <NavMain groups={groups} onNavigate={onNavigate} />
      </SidebarContent>

      {footer != null ? (
        <SidebarFooter className={cn('border-t border-sidebar-border')}>{footer}</SidebarFooter>
      ) : null}

      <SidebarRail data-testid="sidebar-rail" />
    </Sidebar>
  );
}
