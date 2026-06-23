import { buildStorePath } from '@lojao/tenant-host';
import Link from 'next/link';

import { storeLinkClass, storeMutedClass, storePageTitleClass, storeSubtleClass } from '@/lib/store-styles';

interface NotFoundProps {
  params: Promise<{ slug: string }>;
}

export default async function StoreNotFound({ params }: NotFoundProps) {
  const { slug } = await params;

  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <h1 className={storePageTitleClass()}>Loja não encontrada</h1>
      <p className={storeMutedClass('mt-4')}>
        Não encontramos uma loja com o endereço <strong>/store/{slug}</strong>.
      </p>
      <Link href="/" className={storeLinkClass('mt-8 inline-block')}>
        Voltar para Ata Labs
      </Link>
      <p className={storeSubtleClass('mt-4 text-sm')}>
        Procurando a loja demo?{' '}
        <Link href={buildStorePath('demo')} className={storeLinkClass()}>
          /store/demo
        </Link>
      </p>
    </div>
  );
}
