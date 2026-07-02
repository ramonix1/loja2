'use client';

import { buildStorePath } from '@lojao/store-host';
import { IconButton } from '@lojao/ui';
import { ActionIcons } from '@lojao/ui/icons';
import { store as testIds } from '@lojao/test-utils/test-ids/store';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { legacyAssetUrl } from '@/lib/api';
import type { PublicBanner } from '@lojao/types/public-store';

interface BannerCarouselProps {
  banners: PublicBanner[];
  storeSlug: string;
}

export function BannerCarousel({ banners, storeSlug }: BannerCarouselProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) return null;

  const banner = banners[index]!;

  const ctaHref = banner.produto_id
    ? buildStorePath(storeSlug, `/produto/${banner.produto_id}`)
    : banner.cta_url && banner.cta_url !== '#'
      ? banner.cta_url
      : `${buildStorePath(storeSlug)}#produtos`;

  return (
    <section
      data-testid={testIds.homeBannerCarousel}
      className="relative mb-10 overflow-hidden rounded-2xl bg-[var(--store-surface-elevated)]"
    >
      <div
        className="relative flex min-h-[280px] items-center bg-cover bg-center sm:min-h-[360px] lg:min-h-[420px]"
        style={{ backgroundImage: `url(${legacyAssetUrl(banner.imagem)})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        <div className="relative z-10 max-w-xl px-8 py-10 text-white">
          <h2 className="text-2xl font-extrabold sm:text-4xl">{banner.titulo}</h2>
          {banner.subtitulo ? (
            <p className="mt-3 text-base text-white/85 sm:text-lg">{banner.subtitulo}</p>
          ) : null}
          <Link href={ctaHref} className="btn-primary mt-6 inline-block px-8 py-3 text-base">
            {banner.cta_texto}
          </Link>
        </div>
      </div>

      {banners.length > 1 ? (
        <>
          <IconButton
            icon={<ActionIcons.prev />}
            label="Banner anterior"
            onClick={() => setIndex((i) => (i - 1 + banners.length) % banners.length)}
            surface="store"
            variant="ghost"
            size="md"
            className="absolute left-3 top-1/2 z-20 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
          />
          <IconButton
            icon={<ActionIcons.next />}
            label="Próximo banner"
            onClick={() => setIndex((i) => (i + 1) % banners.length)}
            surface="store"
            variant="ghost"
            size="md"
            className="absolute right-3 top-1/2 z-20 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
          />
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                aria-label={`Ir para banner ${i + 1}`}
                className={`h-2.5 w-2.5 rounded-full ${i === index ? 'bg-white' : 'bg-white/40'}`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
