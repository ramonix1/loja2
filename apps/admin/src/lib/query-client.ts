import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Remove cache de dados escopados à loja ativa (admin, agenda, etc.).
 * Obrigatório ao trocar de loja: as query keys não incluem o slug do tenant e
 * o staleTime (30s) faria o dashboard exibir dados da loja anterior até navegar
 * de novo pelos menus.
 */
export function resetStoreScopedQueries(): void {
  queryClient.removeQueries({ queryKey: ['admin'] });
  queryClient.removeQueries({ queryKey: ['admin-agenda'] });
  queryClient.removeQueries({ queryKey: ['store'] });
}

/** @deprecated use resetStoreScopedQueries */
export const resetTenantScopedQueries = resetStoreScopedQueries;
