import {
  adminInputClass,
  adminLabelClass,
  adminMutedClass,
  authCardClass,
  authShellClass,
  cn,
  merchantHubShellClass,
  platformAuthCardClass,
  platformAuthShellClass,
  platformInputClass,
  platformLabelClass,
} from '@lojao/ui';

interface BrandProps {
  className?: string;
  subtitle?: string;
  testId?: string;
}

/** Marca Ata Commerce — tokens admin (respeita toggle escuro/claro). */
export function AtaCommerceBrand({ className, subtitle = 'Painel Admin', testId }: BrandProps) {
  return (
    <div className={cn('mb-6', className)} data-testid={testId}>
      <p className="text-2xl leading-none">
        <span className="font-extrabold text-[var(--admin-text)]">Ata</span>
        <span className="font-normal text-[var(--admin-text-muted)]">Commerce</span>
        <span className="font-bold text-[var(--admin-accent-hover)]">·</span>
      </p>
      {subtitle ? <p className={cn('mt-1.5 text-sm', adminMutedClass())}>{subtitle}</p> : null}
    </div>
  );
}

/** Marca Ata Labs — tokens platform (respeita toggle escuro/claro). */
export function AtaLabsBrand({ className, subtitle = 'Platform Hub', testId }: BrandProps) {
  return (
    <div className={cn('mb-6', className)} data-testid={testId}>
      <p className="text-2xl leading-none">
        <span className="font-extrabold text-[var(--platform-text)]">Ata</span>
        <span className="font-normal text-[var(--platform-text-muted)]">Labs</span>
        <span className="font-bold text-[var(--platform-accent)]">·</span>
      </p>
      {subtitle ? (
        <p className="mt-1.5 text-sm text-[var(--platform-text-muted)]">{subtitle}</p>
      ) : null}
    </div>
  );
}

export {
  adminInputClass,
  adminLabelClass,
  adminMutedClass,
  authCardClass,
  authShellClass,
  merchantHubShellClass,
  platformAuthCardClass,
  platformAuthShellClass,
  platformInputClass,
  platformLabelClass,
};

/** @deprecated Use `adminInputClass()` de `@lojao/ui`. */
export const authInputClass = adminInputClass;

/** @deprecated Use `adminLabelClass()` de `@lojao/ui`. */
export const authLabelClass = adminLabelClass;

/** @deprecated Use `platformInputClass()` de `@lojao/ui`. */
export const platformAuthInputClass = platformInputClass;

/** @deprecated Use `platformLabelClass()` de `@lojao/ui`. */
export const platformAuthLabelClass = platformLabelClass;
