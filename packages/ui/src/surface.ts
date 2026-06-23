import { cn } from './cn';

/** Painéis admin e platform (sidebar, layout). */
export type PanelSurface = 'admin' | 'platform';

/** Superfícies de UI incluindo vitrine tenant. */
export type UiSurface = PanelSurface | 'store';

/** @deprecated Prefer `UiSurface` — alias legado do Sidebar. */
export type SidebarTheme = 'commerce' | 'platform';

export function resolveSurface(
  surface?: UiSurface,
  theme?: SidebarTheme,
): PanelSurface {
  if (surface === 'store') return 'admin';
  if (surface) return surface;
  if (theme === 'platform') return 'platform';
  return 'admin';
}

const surfacePrefix: Record<UiSurface, string> = {
  admin: '--admin',
  platform: '--platform',
  store: '--store',
};

/** Classes de input mobile-first (~44px) — tokens semânticos. */
export function adminInputClass(className?: string) {
  return cn(
    'w-full min-h-[2.75rem] touch-manipulation rounded-lg border px-3 py-2 text-sm outline-none',
    'border-[var(--admin-input-border)] bg-[var(--admin-input-bg)] text-[var(--admin-text)]',
    'placeholder:text-[var(--admin-input-placeholder)]',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[var(--admin-focus-ring)]',
    className,
  );
}

export function platformInputClass(className?: string) {
  return cn(
    'w-full min-h-[2.75rem] touch-manipulation rounded-lg border px-3 py-2 text-sm outline-none',
    'border-[var(--platform-input-border)] bg-[var(--platform-input-bg)] text-[var(--platform-text)]',
    'placeholder:text-[var(--platform-input-placeholder)]',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[var(--platform-focus-ring)]',
    className,
  );
}

export function storeInputClass(className?: string) {
  return cn(
    'w-full min-h-[2.75rem] touch-manipulation rounded-lg border px-3 py-2 text-sm outline-none',
    'border-[var(--store-input-border)] bg-[var(--store-input-bg)] text-[var(--store-text)]',
    'placeholder:text-[var(--store-text-subtle)]',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[var(--store-focus-ring)]',
    className,
  );
}

export function adminMutedClass(className?: string) {
  return cn('text-[var(--admin-text-muted)]', className);
}

export function platformMutedClass(className?: string) {
  return cn('text-[var(--platform-text-muted)]', className);
}

export function platformSubtleClass(className?: string) {
  return cn('text-[var(--platform-text-subtle)]', className);
}

export function platformLabelClass(className?: string) {
  return cn('mb-1 block text-sm font-medium text-[var(--platform-text-muted)]', className);
}

export function platformNavLinkClass(isActive: boolean, className?: string) {
  return cn(
    'flex min-h-12 touch-manipulation items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
    isActive
      ? 'bg-[var(--platform-sidebar-active-bg)] font-semibold text-[var(--platform-sidebar-text)]'
      : 'text-[var(--platform-sidebar-muted)] hover:bg-[var(--platform-sidebar-hover-bg)] hover:text-[var(--platform-sidebar-text)]',
    className,
  );
}

export function platformSidebarLinkClass(isActive: boolean, className?: string) {
  return platformNavLinkClass(isActive, cn('mb-2 w-full text-left', className));
}

export function platformAuthShellClass(className?: string) {
  return cn('platform-auth-shell platform-auth-shell--centered', className);
}

export function platformAuthCardClass(className?: string) {
  return cn('platform-auth-card', className);
}

export function adminSubtleClass(className?: string) {
  return cn('text-[var(--admin-text-subtle)]', className);
}

export function adminLabelClass(className?: string) {
  return cn('mb-1 block text-sm font-medium text-[var(--admin-text-muted)]', className);
}

export function adminNavLinkClass(isActive: boolean, className?: string) {
  return cn(
    'flex min-h-12 touch-manipulation items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
    isActive
      ? 'bg-[var(--admin-sidebar-active-bg)] font-semibold text-[var(--admin-sidebar-text)]'
      : 'text-[var(--admin-sidebar-muted)] hover:bg-[var(--admin-sidebar-hover-bg)] hover:text-[var(--admin-sidebar-text)]',
    className,
  );
}

export function adminSidebarLinkClass(isActive: boolean, className?: string) {
  return adminNavLinkClass(isActive, cn('mb-2 w-full text-left', className));
}

export function adminShellClass(className?: string) {
  return cn('admin-auth-shell', className);
}

export function authShellClass(className?: string) {
  return cn('admin-auth-shell admin-auth-shell--centered', className);
}

export function merchantHubShellClass(className?: string) {
  return cn('admin-auth-shell admin-auth-shell--hub', className);
}

export function authCardClass(className?: string) {
  return cn('admin-auth-card', className);
}

export function surfaceVar(surface: UiSurface, token: string): string {
  return `var(${surfacePrefix[surface]}-${token})`;
}
