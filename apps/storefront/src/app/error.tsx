'use client';

import { storeErrorTextClass, storeHeadingClass, storeMutedClass, storePanelClass } from '@/lib/store-styles';

export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className={storePanelClass('mx-auto max-w-lg text-center')}>
      <h2 className={storeHeadingClass('text-xl')}>Não foi possível carregar a loja</h2>
      <p className={storeMutedClass('mt-2 text-sm')}>
        Verifique se a API está no ar ou tente novamente em instantes.
      </p>
      {process.env.NODE_ENV !== 'production' ? (
        <p className={storeErrorTextClass('mt-4 text-left text-xs')}>{error.message}</p>
      ) : null}
      <button type="button" onClick={() => reset()} className="btn-primary mt-6 px-6 py-2">
        Tentar novamente
      </button>
    </div>
  );
}
