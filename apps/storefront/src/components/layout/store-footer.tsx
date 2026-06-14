import type { PublicStoreData } from '@lojao/types/public-store';

interface StoreFooterProps {
  store: PublicStoreData['loja'];
}

export function StoreFooter({ store }: StoreFooterProps) {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white py-8">
      <div className="mx-auto max-w-6xl px-4 text-center text-sm text-gray-500">
        <p className="font-semibold text-gray-800">{store.nome}</p>
        {store.slogan ? <p className="mt-1">{store.slogan}</p> : null}
        <p className="mt-4">&copy; {new Date().getFullYear()} {store.nome}. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
