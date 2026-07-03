'use client';

import { ChevronRightIcon } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  isExpandableChildActive,
  isPathActive,
  type ShellNavGroup,
} from './shell-nav-types';

export interface NavMainProps {
  groups: ReadonlyArray<ShellNavGroup>;
  onNavigate?: () => void;
}

/** Nav principal da sidebar — padrão dashboard-01 / sidebar-07. */
export function NavMain({ groups, onNavigate }: NavMainProps) {
  const location = useLocation();
  const currentPath = location.pathname + location.search;
  const { isMobile, setOpenMobile } = useSidebar();

  function handleNavigate() {
    onNavigate?.();
    if (isMobile) setOpenMobile(false);
  }

  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.id} data-testid={`nav-group-${group.id}`}>
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarMenu>
            {group.items.map((item) => {
              if (item.type === 'link') {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild tooltip={item.label} isActive={isPathActive(currentPath, item.to)}>
                      <NavLink to={item.to} onClick={handleNavigate}>
                        <Icon className="size-4 shrink-0" aria-hidden />
                        <span>{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              }

              if (item.type === 'external') {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild tooltip={item.label}>
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleNavigate}
                      >
                        <Icon className="size-4 shrink-0" aria-hidden />
                        <span>{item.label}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              }

              const Icon = item.icon;
              const childActive = isExpandableChildActive(currentPath, item.children);
              const defaultOpen = childActive;

              return (
                <Collapsible
                  key={item.label}
                  asChild
                  defaultOpen={defaultOpen}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.label} isActive={childActive}>
                        <Icon className="size-4 shrink-0" aria-hidden />
                        <span>{item.label}</span>
                        <ChevronRightIcon className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.children.map((child) => (
                          <SidebarMenuSubItem key={child.to}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={
                                isPathActive(currentPath, child.to) || currentPath === child.to
                              }
                            >
                              <NavLink to={child.to} onClick={handleNavigate}>
                                <span>{child.label}</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  );
}
