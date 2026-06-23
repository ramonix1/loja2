import { marketing as testIds } from '@lojao/test-utils/test-ids/marketing';
import Link from 'next/link';

import { AtaLogo } from '@/components/marketing/ata-logo';

const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'contato@atalabs.com.br';

export function MarketingFooter() {
  return (
    <footer
      data-testid={testIds.footer}
      className="bg-verde-conde py-16 text-white"
    >
      <div className="mx-auto mb-12 grid max-w-7xl gap-12 px-6 md:grid-cols-3">
        <div>
          <AtaLogo variant="light" href="/" />
          <p className="mt-5 text-sm leading-relaxed text-white/35">
            Compartilhando Soluções para impulsionar
            <br />o comércio digital brasileiro.
          </p>
        </div>

        <div>
          <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/25">
            Navegação
          </p>
          <ul className="space-y-3 text-sm text-white/50">
            <li>
              <Link href="/#solucoes" className="transition-colors hover:text-white">
                Soluções
              </Link>
            </li>
            <li>
              <Link href="/#atacommerce" className="transition-colors hover:text-white">
                Ata Commerce
              </Link>
            </li>
            <li>
              <Link href="/#sobre" className="transition-colors hover:text-white">
                Sobre a Ata Labs
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="transition-colors hover:text-white">
                Planos
              </Link>
            </li>
            <li>
              <Link href="/#contato" className="transition-colors hover:text-white">
                Contato
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/25">
            Contato
          </p>
          <ul className="space-y-3 text-sm text-white/50">
            <li>
              <a href={`mailto:${CONTACT_EMAIL}`} className="transition-colors hover:text-white">
                {CONTACT_EMAIL}
              </a>
            </li>
            <li>atalabs.com.br</li>
          </ul>
        </div>
      </div>

      <div
        className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 border-t px-6 pt-8 text-[11px] text-white/20 md:flex-row"
        style={{ borderColor: 'rgba(255,255,255,.07)' }}
      >
        <span>© {new Date().getFullYear()} Ata Labs. Todos os direitos reservados.</span>
        <span>Manual de Identidade Visual v1 · 2026</span>
      </div>
    </footer>
  );
}
