import type { ComponentType } from 'react';

export type ShellNavIcon = ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;

export type ShellNavChild = {
  to: string;
  label: string;
};

export type ShellNavLinkItem = {
  type: 'link';
  to: string;
  label: string;
  icon: ShellNavIcon;
};

export type ShellNavExpandableItem = {
  type: 'expandable';
  label: string;
  icon: ShellNavIcon;
  children: ReadonlyArray<ShellNavChild>;
};

export type ShellNavExternalItem = {
  type: 'external';
  href: string;
  label: string;
  icon: ShellNavIcon;
};

export type ShellNavItem = ShellNavLinkItem | ShellNavExpandableItem | ShellNavExternalItem;

export type ShellNavGroup = {
  id: string;
  label: string;
  items: ReadonlyArray<ShellNavItem>;
};

export function isPathActive(currentPath: string, target: string): boolean {
  if (currentPath === target) return true;
  const [targetPath, targetQuery] = target.split('?');
  const [currentPathOnly] = currentPath.split('?');
  if (targetQuery) return false;
  return currentPathOnly === targetPath;
}

export function isExpandableChildActive(currentPath: string, children: ReadonlyArray<ShellNavChild>): boolean {
  return children.some(
    (child) => currentPath === child.to || isPathActive(currentPath, child.to),
  );
}
