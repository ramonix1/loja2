'use client';

import { marketing as testIds } from '@lojao/test-utils/test-ids/marketing';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { AtaLogo } from '@/components/marketing/ata-logo';

const NAV_LINKS = [
  { href: '/#solucoes', label: 'Soluções' },
  { href: '/ata-commerce', label: 'Ata Commerce' },
  { href: '/pricing', label: 'Planos' },
  { href: '/#sobre', label: 'Sobre' },
  { href: '/#contato', label: 'Contato' },
] as const;

export type MarketingHeaderVariant = 'over-hero' | 'solid';

interface MarketingHeaderProps {
  variant?: MarketingHeaderVariant;
}

export function MarketingHeader({ variant = 'solid' }: MarketingHeaderProps) {
  const [scrolled, setScrolled] = useState(variant === 'solid');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (variant === 'solid') {
      setScrolled(true);
      return;
    }
    const update = () => setScrolled(window.scrollY > 50);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [variant]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isSolid = scrolled || menuOpen;
  const logoVariant = isSolid ? 'dark' : 'light';
  const navTextClass = isSolid ? 'text-cinza-pedra hover:text-verde-conde' : 'text-white/80 hover:text-white';

  return (
    <header
      data-testid={testIds.header}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        isSolid
          ? 'border-b border-verde-conde/5 bg-white/97 shadow-[0_1px_0_rgba(23,52,4,0.07)] backdrop-blur-md'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <AtaLogo variant={logoVariant} />

        <nav
          data-testid={testIds.headerNav}
          className="hidden items-center gap-8 text-sm font-normal md:flex"
        >
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={`nav-link transition-colors ${navTextClass}`}>
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/pricing"
          className="hidden items-center gap-2 rounded-full bg-verde-broto px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-verde-mata md:inline-flex"
        >
          <span className="h-2 w-2 rounded-full bg-white/70" />
          Contratar agora
        </Link>

        <button
          type="button"
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className={`p-2 md:hidden ${isSolid ? 'text-verde-conde' : 'text-white'}`}
        >
          {menuOpen ? (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {menuOpen && (
        <div className="fixed top-16 right-0 left-0 z-40 border-t border-cinza-areia bg-white shadow-lg md:hidden">
          <nav className="flex flex-col divide-y divide-cinza-areia/30">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="px-6 py-4 font-semibold text-verde-conde transition-colors hover:bg-creme"
              >
                {link.label}
              </Link>
            ))}
            <div className="px-6 py-5">
              <Link
                href="/pricing"
                onClick={() => setMenuOpen(false)}
                className="block rounded-full bg-verde-broto py-3 text-center font-semibold text-white"
              >
                Contratar agora
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
