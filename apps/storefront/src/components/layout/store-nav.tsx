'use client';

import { Button } from '@lojao/ui';
import { ActionIcons, NavIcons } from '@lojao/ui/icons';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { fetchMe, logout, type AuthUser } from '@/lib/client-api';
import { adminDashboardUrl } from '@/lib/config';
import { storeButtonPillClass, storeShellClasses } from '@/lib/store-styles';
import { useStoreHref } from '@/lib/use-store-href';

interface StoreNavProps {
  /** Fecha o Sheet mobile após navegação. */
  onNavigate?: () => void;
  /** Empilha links (menu mobile). */
  stacked?: boolean;
}

function navItemClass(linkClass: string, stacked: boolean) {
  return stacked
    ? `${linkClass} flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium`
    : `${linkClass} inline-flex min-h-11 items-center gap-2 touch-manipulation`;
}

export function StoreNav({ onNavigate, stacked = false }: StoreNavProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const homeHref = useStoreHref('/');
  const loginHref = useStoreHref('/login');
  const cadastroHref = useStoreHref('/cadastro');
  const pedidosHref = useStoreHref('/meus-pedidos');
  const wishlistHref = useStoreHref('/wishlist');
  const linkClass = storeShellClasses().navLink;
  const itemClass = (extra?: string) => navItemClass(linkClass, stacked) + (extra ? ` ${extra}` : '');

  const OrdersIcon = NavIcons.orders;
  const WishlistIcon = NavIcons.wishlist;
  const LogoutIcon = ActionIcons.logout;
  const LoginIcon = ActionIcons.forward;

  useEffect(() => {
    fetchMe()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await logout();
    onNavigate?.();
    window.location.href = homeHref;
  }

  if (loading) {
    return <span className="opacity-50">…</span>;
  }

  const wrapClass = stacked ? 'flex flex-col gap-1' : 'flex items-center gap-3 sm:gap-4';

  if (!user) {
    return (
      <div className={wrapClass}>
        <Link href={loginHref} className={itemClass()} onClick={onNavigate}>
          <LoginIcon className="size-5 shrink-0" aria-hidden />
          Entrar
        </Link>
        <Button surface="store" variant="primary" asChild className={storeButtonPillClass('text-sm')}>
          <Link href={cadastroHref} onClick={onNavigate}>
            Cadastrar
          </Link>
        </Button>
      </div>
    );
  }

  if (user.role === 'admin') {
    return (
      <Button surface="store" variant="primary" asChild className={storeButtonPillClass('text-sm')}>
        <a href={adminDashboardUrl()} onClick={onNavigate}>
          Painel admin
        </a>
      </Button>
    );
  }

  return (
    <div className={wrapClass}>
      <Link href={wishlistHref} className={itemClass()} onClick={onNavigate}>
        <WishlistIcon className="size-5 shrink-0" aria-hidden />
        Favoritos
      </Link>
      <Link href={pedidosHref} className={itemClass()} onClick={onNavigate}>
        <OrdersIcon className="size-5 shrink-0" aria-hidden />
        Meus pedidos
      </Link>
      <button type="button" onClick={() => void handleLogout()} className={itemClass()}>
        <LogoutIcon className="size-5 shrink-0" aria-hidden />
        Sair
      </button>
    </div>
  );
}
