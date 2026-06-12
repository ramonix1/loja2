import { admin } from './admin.js';
import { auth } from './auth.js';

/**
 * Catálogo central de data-testid do produto.
 *
 * Importar como `import { testIds } from '@lojao/test-utils/test-ids'`.
 * Novos grupos (checkout, vitrine...) são adicionados por fase.
 */
export const testIds = {
  auth,
  admin,
} as const;

export { auth, admin };
