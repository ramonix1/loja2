'use client';

import { useState, type ReactNode } from 'react';

import { HiOutlineChevronRight } from '../icons';
import { cn } from '../cn';

function navLinkBase(isActive: boolean) {
  return cn(
    'flex min-h-12 touch-manipulation items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
    isActive
      ? 'bg-[var(--shell-sidebar-active-bg)] font-semibold text-[var(--shell-sidebar-text)]'
      : 'text-[var(--shell-sidebar-muted)] hover:bg-[var(--shell-sidebar-hover-bg)] hover:text-[var(--shell-sidebar-text)]',
  );
}

export interface NavGroupProps {
  id: string;
  label: string;
  children: ReactNode;
  className?: string;
}

export function NavGroup({ id, label, children, className }: NavGroupProps) {
  return (
    <div className={cn('mb-3', className)} data-testid={`nav-group-${id}`}>
      <div className="mb-1 px-3 text-[0.65rem] font-semibold tracking-wider text-[var(--shell-sidebar-muted)] uppercase">
        {label}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

export interface NavItemProps {
  isActive?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  to?: string;
  as?: 'button' | 'a' | 'div';
}

/** Item de nav — renderiza como filho (NavLink) ou botão/link nativo. */
export function NavItem({
  isActive = false,
  icon,
  children,
  className,
  onClick,
  href,
  as = 'div',
}: NavItemProps) {
  const classes = cn(navLinkBase(isActive), className);

  if (as === 'button') {
    return (
      <button type="button" className={cn(classes, 'w-full text-left')} onClick={onClick}>
        {icon}
        {children}
      </button>
    );
  }

  if (as === 'a' && href) {
    return (
      <a href={href} className={classes} onClick={onClick}>
        {icon}
        {children}
      </a>
    );
  }

  return <div className={classes}>{icon}{children}</div>;
}

export interface NavItemExpandableProps {
  label: string;
  icon?: ReactNode;
  isOpen?: boolean;
  defaultOpen?: boolean;
  isChildActive?: boolean;
  onToggle?: () => void;
  children: ReactNode;
  className?: string;
}

export function NavItemExpandable({
  label,
  icon,
  isOpen: controlledOpen,
  defaultOpen = false,
  isChildActive = false,
  onToggle,
  children,
  className,
}: NavItemExpandableProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen || isChildActive);
  const open = controlledOpen ?? internalOpen;

  function toggle() {
    if (onToggle) onToggle();
    else setInternalOpen((v) => !v);
  }

  return (
    <div className={className}>
      <button
        type="button"
        className={cn(
          navLinkBase(isChildActive),
          'w-full justify-between text-left',
        )}
        aria-expanded={open}
        onClick={toggle}
      >
        <span className="flex min-w-0 items-center gap-3">
          {icon}
          <span className="truncate">{label}</span>
        </span>
        <HiOutlineChevronRight
          className={cn('size-4 shrink-0 transition-transform', open && 'rotate-90')}
          aria-hidden
        />
      </button>
      {open ? <div className="mt-0.5 space-y-0.5 pl-9">{children}</div> : null}
    </div>
  );
}

export interface NavSubItemProps {
  isActive?: boolean;
  children: ReactNode;
  className?: string;
}

export function NavSubItem({ isActive = false, children, className }: NavSubItemProps) {
  return (
    <div className={cn(navLinkBase(isActive), 'min-h-10 py-2 text-[0.8125rem]', className)}>
      {children}
    </div>
  );
}

export function shellNavLinkClass(isActive: boolean, className?: string) {
  return cn(navLinkBase(isActive), className);
}
