'use client';

import type { StoreTheme } from '@lojao/types/store-theme';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { fetchMe, logout, type AuthUser } from '@/lib/client-api';
import { adminDashboardUrl } from '@/lib/config';
import { storeShellClasses } from '@/lib/store-styles';
import { useStoreHref } from '@/lib/use-store-href';

interface StoreNavProps {
  tema?: StoreTheme;
}

export function StoreNav({ tema = 'escuro' }: StoreNavProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const homeHref = useStoreHref('/');
  const loginHref = useStoreHref('/login');
  const cadastroHref = useStoreHref('/cadastro');
  const carrinhoHref = useStoreHref('/carrinho');
  const pedidosHref = useStoreHref('/meus-pedidos');
  const linkClass = storeShellClasses(tema).navLink;

  useEffect(() => {
    fetchMe()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await logout();
    window.location.href = homeHref;
  }

  if (loading) {
    return <span className="opacity-50">…</span>;
  }

  if (!user) {
    return (
      <>
        <Link href={loginHref} className={linkClass}>
          Entrar
        </Link>
        <Link href={cadastroHref} className="btn-primary text-sm">
          Cadastrar
        </Link>
      </>
    );
  }

  if (user.role === 'admin') {
    return (
      <a href={adminDashboardUrl()} className="btn-primary text-sm">
        Painel admin
      </a>
    );
  }

  return (
    <>
      <Link href={carrinhoHref} className={linkClass}>
        Carrinho
      </Link>
      <Link href={pedidosHref} className={linkClass}>
        Meus pedidos
      </Link>
      <button type="button" onClick={handleLogout} className={linkClass}>
        Sair
      </button>
    </>
  );
}
