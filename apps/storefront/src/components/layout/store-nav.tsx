'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { fetchMe, logout, type AuthUser } from '@/lib/client-api';

export function StoreNav() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMe()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await logout();
    window.location.href = '/';
  }

  if (loading) {
    return <span className="text-gray-400">…</span>;
  }

  if (!user) {
    return (
      <>
        <Link href="/login" className="text-gray-300 hover:text-white">
          Entrar
        </Link>
        <Link href="/cadastro" className="btn-primary text-sm">
          Cadastrar
        </Link>
      </>
    );
  }

  if (user.role === 'admin') {
    return (
      <a
        href={process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:5173/admin/dashboard'}
        className="btn-primary text-sm"
      >
        Painel admin
      </a>
    );
  }

  return (
    <>
      <Link href="/carrinho" className="text-gray-300 hover:text-white">
        Carrinho
      </Link>
      <Link href="/meus-pedidos" className="text-gray-300 hover:text-white">
        Meus pedidos
      </Link>
      <button type="button" onClick={handleLogout} className="text-gray-300 hover:text-white">
        Sair
      </button>
    </>
  );
}
