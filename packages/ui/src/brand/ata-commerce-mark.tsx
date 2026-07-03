import { cn } from '../cn';

export interface AtaCommerceMarkProps {
  className?: string;
  /** Acessibilidade — omitir quando decorativo (ex.: ao lado de wordmark visível). */
  title?: string;
}

/** Marca neutra Ata Commerce (favicon admin) — uso em sidebar e favicon. */
export function AtaCommerceMark({ className, title }: AtaCommerceMarkProps) {
  const decorative = title == null;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="none"
      className={cn('size-8 shrink-0 rounded-lg', className)}
      role={decorative ? 'presentation' : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-label={title}
    >
      <rect width="32" height="32" rx="8" fill="#012A7E" />
      <circle cx="24" cy="8" r="4" fill="#2E8FFB" />
      <text
        x="16"
        y="22"
        textAnchor="middle"
        fill="#FFFFFF"
        fontFamily="Figtree, ui-sans-serif, system-ui, sans-serif"
        fontSize="14"
        fontWeight="800"
      >
        A
      </text>
    </svg>
  );
}
