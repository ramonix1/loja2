'use client';

import { buildStorePath } from '@lojao/store-host';
import { Button, IconButton, Skeleton } from '@lojao/ui';
import { ActionIcons } from '@lojao/ui/icons';
import { store as testIds } from '@lojao/test-utils/test-ids/store';
import Link from 'next/link';
import { useRef, useState } from 'react';
import type { Swiper as SwiperType } from 'swiper';
import { Autoplay } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import { legacyAssetUrl } from '@/lib/api';
import { storeButtonPillClass } from '@/lib/store-styles';
import type { PublicBanner } from '@lojao/types/public-store';

interface BannerCarouselProps {
  banners: PublicBanner[];
  storeSlug: string;
  /** @deprecated Visual único carousel (Swiper centered). */
  variant?: 'default' | 'light';
}

const BANNER_HEIGHT = 'h-[300px] sm:h-[360px] lg:h-[400px]';

const BANNER_BLEED = 'store-banner-bleed';

function resolveBannerCtaHref(banner: PublicBanner, storeSlug: string): string {
  if (banner.produto_id) {
    return buildStorePath(storeSlug, `/produto/${banner.produto_id}`);
  }
  if (banner.cta_url && banner.cta_url !== '#') {
    return banner.cta_url;
  }
  return `${buildStorePath(storeSlug)}#produtos`;
}

function BannerSkeleton() {
  return (
    <div
      className={`${BANNER_HEIGHT} w-full overflow-hidden bg-[var(--store-surface-elevated)]`}
      aria-hidden
    >
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col justify-center gap-3 px-4 py-10 sm:px-6">
        <Skeleton className="h-4 w-32 rounded-full bg-[var(--store-border)]" />
        <Skeleton className="h-10 w-full max-w-md rounded-lg bg-[var(--store-border)]" />
        <Skeleton className="mt-2 h-11 w-36 rounded-[var(--store-radius-pill)] bg-[var(--store-border)]" />
      </div>
    </div>
  );
}

function BannerSlideContent({
  banner,
  storeSlug,
}: {
  banner: PublicBanner;
  storeSlug: string;
}) {
  const ctaHref = resolveBannerCtaHref(banner, storeSlug);

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl items-center px-4 sm:px-6">
      <div className="w-full min-w-0 max-w-md">
        <h2 className="line-clamp-3 text-2xl font-extrabold leading-tight text-white sm:text-3xl lg:text-4xl">
          {banner.titulo}
        </h2>
        {banner.subtitulo ? (
          <p className="mt-3 line-clamp-2 text-base text-white/85 sm:text-lg">
            {banner.subtitulo}
          </p>
        ) : null}
        <div className="mt-6">
          <Button
            surface="store"
            variant="secondary"
            asChild
            className={storeButtonPillClass(
              'max-w-full truncate border-white/25 bg-white px-6 py-3 text-base font-semibold text-[var(--cor-primaria)] hover:bg-white/90',
            )}
          >
            <Link href={ctaHref}>{banner.cta_texto}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function BannerSlide({
  banner,
  storeSlug,
}: {
  banner: PublicBanner;
  storeSlug: string;
}) {
  return (
    <article className={`relative ${BANNER_HEIGHT} w-full overflow-hidden rounded-lg`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={legacyAssetUrl(banner.imagem)}
        alt=""
        aria-hidden
        className="absolute inset-0 size-full object-cover object-center"
        loading="eager"
        decoding="async"
      />

      <div
        className="absolute inset-0 bg-gradient-to-r from-[var(--cor-primaria)] via-[var(--cor-primaria)]/88 to-[var(--cor-primaria)]/20 sm:via-[var(--cor-primaria)]/72 sm:to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-[min(100%,560px)] bg-gradient-to-r from-black/25 to-transparent"
        aria-hidden
      />

      <div className="absolute inset-0 z-10">
        <BannerSlideContent banner={banner} storeSlug={storeSlug} />
      </div>
    </article>
  );
}

function BannerPagination({
  count,
  activeIndex,
  onSelect,
}: {
  count: number;
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="mt-4 flex justify-center gap-2" role="tablist" aria-label="Slides do banner">
      {Array.from({ length: count }, (_, index) => (
        <button
          key={index}
          type="button"
          role="tab"
          aria-selected={index === activeIndex}
          aria-label={`Ir para banner ${index + 1}`}
          className={`h-2.5 w-2.5 rounded-full transition-colors ${index === activeIndex
              ? 'bg-[var(--cor-primaria)]'
              : 'bg-[var(--store-border)] hover:bg-[var(--store-text-subtle)]'
            }`}
          onClick={() => onSelect(index)}
        />
      ))}
    </div>
  );
}

export function BannerCarousel({ banners, storeSlug }: BannerCarouselProps) {
  const swiperRef = useRef<SwiperType | null>(null);
  const [ready, setReady] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const single = banners.length <= 1;

  if (banners.length === 0) return null;

  if (single) {
    return (
      <section
        data-testid={testIds.homeBannerCarousel}
        className={`${BANNER_BLEED} relative mb-10`}
        aria-label="Destaques da loja"
      >
        <BannerSlide banner={banners[0]!} storeSlug={storeSlug} />
      </section>
    );
  }

  return (
    <section
      data-testid={testIds.homeBannerCarousel}
      className={`${BANNER_BLEED} relative mb-10`}
      aria-label="Destaques da loja"
    >
      {!ready ? (
        <div className="absolute inset-x-0 top-0 z-10">
          <BannerSkeleton />
        </div>
      ) : null}

      <div
        className={`relative transition-opacity duration-300 ${ready ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      >
        <Swiper
          modules={[Autoplay]}
          slidesPerView="auto"
          centeredSlides
          spaceBetween={0}
          rewind
          watchSlidesProgress
          grabCursor
          speed={550}
          autoplay={{
            delay: 6000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
            setActiveIndex(swiper.activeIndex);
            requestAnimationFrame(() => setReady(true));
          }}
          onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
          className="store-banner-swiper"
        >
          {banners.map((banner) => (
            <SwiperSlide key={banner.id}>
              <BannerSlide banner={banner} storeSlug={storeSlug} />
            </SwiperSlide>
          ))}
        </Swiper>

        <IconButton
          icon={<ActionIcons.prev />}
          label="Banner anterior"
          onClick={() => swiperRef.current?.slidePrev()}
          surface="store"
          variant="ghost"
          size="md"
          className="absolute left-3 top-[calc(50%-1.25rem)] z-20 -translate-y-1/2 bg-[var(--store-surface)]/95 shadow-sm sm:left-5"
        />
        <IconButton
          icon={<ActionIcons.next />}
          label="Próximo banner"
          onClick={() => swiperRef.current?.slideNext()}
          surface="store"
          variant="ghost"
          size="md"
          className="absolute right-3 top-[calc(50%-1.25rem)] z-20 -translate-y-1/2 bg-[var(--store-surface)]/95 shadow-sm sm:right-5"
        />

        <BannerPagination
          count={banners.length}
          activeIndex={activeIndex}
          onSelect={(index) => swiperRef.current?.slideTo(index)}
        />
      </div>
    </section>
  );
}
