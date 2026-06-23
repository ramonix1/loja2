import type { PublicStoreData } from '@lojao/types/public-store';
import type { StoreTheme } from '@lojao/types/store-theme';

import { storeShellClasses } from '@/lib/store-styles';

interface StoreFooterProps {
  store: PublicStoreData['loja'];
}

export function StoreFooter({ store }: StoreFooterProps) {
  const tema: StoreTheme = store.tema ?? 'escuro';
  const styles = storeShellClasses(tema);

  return (
    <footer className={`mt-auto border-t py-8 ${styles.footer}`}>
      <div className="mx-auto max-w-6xl px-4 text-center text-sm">
        <p className={`font-semibold ${styles.footerTitle}`}>{store.nome}</p>
        {store.slogan ? <p className="mt-1">{store.slogan}</p> : null}
        <p className="mt-4">
          &copy; {new Date().getFullYear()} {store.nome}. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
