'use client';

import { NavIcons } from '@lojao/ui/icons';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { fetchMe, type AuthUser } from '@/lib/client-api';
import { adminDashboardUrl } from '@/lib/config';
import { useStoreHref, useStoreLoginHref } from '@/lib/use-store-href';

interface StoreAccountLinkProps {
  className?: string;
  onNavigate?: () => void;
}

const accountButtonClass =
  'inline-flex min-h-12 min-w-12 items-center justify-center rounded-lg text-[var(--store-text-muted)] transition hover:bg-[var(--store-surface-elevated)] hover:text-[var(--store-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[var(--store-focus-ring)]';

export function StoreAccountLink({ className, onNavigate }: StoreAccountLinkProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const loginHref = useStoreLoginHref('/');
  const pedidosHref = useStoreHref('/meus-pedidos');
  const AccountIcon = NavIcons.compradores;

  useEffect(() => {
    fetchMe()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <span
        className={`inline-flex min-h-12 min-w-12 items-center justify-center opacity-40 ${className ?? ''}`}
        aria-hidden
      >
        …
      </span>
    );
  }

  if (!user) {
    return (
      <Link
        href={loginHref}
        aria-label="Entrar na conta"
        title="Entrar na conta"
        onClick={onNavigate}
        className={`${accountButtonClass} ${className ?? ''}`}
      >
        <AccountIcon className="size-6 shrink-0" aria-hidden />
      </Link>
    );
  }

  if (user.role === 'admin') {
    return (
      <a
        href={adminDashboardUrl()}
        aria-label="Painel admin"
        title="Painel admin"
        onClick={onNavigate}
        className={`${accountButtonClass} ${className ?? ''}`}
      >
        <AccountIcon className="size-6 shrink-0" aria-hidden />
      </a>
    );
  }

  return (
    <Link
      href={pedidosHref}
      aria-label="Minha conta"
      title="Minha conta"
      onClick={onNavigate}
      className={`${accountButtonClass} ${className ?? ''}`}
    >
      <AccountIcon className="size-6 shrink-0" aria-hidden />
    </Link>
  );
}
