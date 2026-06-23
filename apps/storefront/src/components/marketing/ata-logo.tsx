import Image from 'next/image';
import Link from 'next/link';

export type AtaLogoVariant = 'light' | 'dark';

interface AtaLogoProps {
  variant?: AtaLogoVariant;
  href?: string;
  showWordmark?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { img: 28, text: 'text-lg' },
  md: { img: 32, text: 'text-[1.35rem]' },
  lg: { img: 36, text: 'text-2xl' },
} as const;

export function AtaLogo({
  variant = 'dark',
  href = '/',
  showWordmark = true,
  className = '',
  size = 'md',
}: AtaLogoProps) {
  const isLight = variant === 'light';
  const { img, text } = sizeMap[size];
  const src = isLight ? '/marketing/ata-fruit-white.png' : '/marketing/ata-fruit-cut.png';

  const wordmark = showWordmark ? (
    <span className={`${text} leading-none select-none`}>
      <span className={isLight ? 'font-extrabold text-white' : 'font-extrabold text-verde-conde'}>
        Ata
      </span>
      <span className={isLight ? 'font-normal text-white/50' : 'font-normal text-cinza-pedra'}>
        Labs
      </span>
      <span className="font-bold text-verde-broto">·</span>
    </span>
  ) : null;

  const content = (
    <>
      <Image src={src} alt="" width={img} height={img} className="h-auto w-auto" aria-hidden />
      {wordmark}
    </>
  );

  const classes = `inline-flex items-center gap-2.5 group ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return <div className={classes}>{content}</div>;
}

/** Marca do produto Ata Commerce (mesmo padrão tipográfico). */
export function AtaCommerceWordmark({
  variant = 'dark',
  className = '',
}: {
  variant?: AtaLogoVariant;
  className?: string;
}) {
  const isLight = variant === 'light';

  return (
    <span className={`leading-none ${className}`}>
      <span className={isLight ? 'font-extrabold text-white' : 'font-extrabold text-azul-noite'}>
        Ata
      </span>
      <span className={isLight ? 'font-normal text-white/50' : 'font-normal text-cinza-pedra'}>
        Commerce
      </span>
      <span className="font-bold text-azul-vivido">·</span>
    </span>
  );
}
