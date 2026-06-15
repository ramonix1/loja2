'use client';

export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
      <h2 className="text-xl font-bold text-gray-900">Não foi possível carregar a loja</h2>
      <p className="mt-2 text-sm text-gray-600">
        Verifique se a API está no ar ou tente novamente em instantes.
      </p>
      {process.env.NODE_ENV !== 'production' ? (
        <p className="mt-4 text-left text-xs text-red-700">{error.message}</p>
      ) : null}
      <button type="button" onClick={() => reset()} className="btn-primary mt-6 px-6 py-2">
        Tentar novamente
      </button>
    </div>
  );
}
