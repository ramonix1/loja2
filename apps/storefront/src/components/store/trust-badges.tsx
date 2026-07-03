'use client';

import { NavIcons } from '@lojao/ui/icons';
import { store as testIds } from '@lojao/test-utils/test-ids/store';
import Link from 'next/link';

import { Card } from '@lojao/ui';
import { storeHeadingClass, storeMutedClass } from '@/lib/store-styles';
import { useStoreHref } from '@/lib/use-store-href';

interface TrustBadgesProps {
  className?: string;
}

export function TrustBadges({ className }: TrustBadgesProps) {
  const checkoutHref = useStoreHref('/checkout');
  const DeliveryIcon = NavIcons.pedidos;
  const ReturnsIcon = NavIcons.permissoes;

  return (
    <Card
      surface="store"
      data-testid={testIds.productTrust}
      className={`grid gap-4 p-4 shadow-sm sm:grid-cols-2 ${className ?? ''}`}
    >
      <div className="flex gap-3">
        <DeliveryIcon className="mt-0.5 size-6 shrink-0 text-[var(--cor-primaria)]" aria-hidden />
        <div>
          <p className={storeHeadingClass('text-sm')}>Entrega</p>
          <p className={storeMutedClass('mt-1 text-sm')}>
            Calcule frete e prazo no{' '}
            <Link href={checkoutHref} className="font-medium text-[var(--store-link)] underline">
              checkout
            </Link>
            .
          </p>
        </div>
      </div>
      <div className="flex gap-3">
        <ReturnsIcon className="mt-0.5 size-6 shrink-0 text-[var(--cor-primaria)]" aria-hidden />
        <div>
          <p className={storeHeadingClass('text-sm')}>Trocas</p>
          <p className={storeMutedClass('mt-1 text-sm')}>
            Consulte a política de trocas e devoluções com o lojista.
          </p>
        </div>
      </div>
    </Card>
  );
}
