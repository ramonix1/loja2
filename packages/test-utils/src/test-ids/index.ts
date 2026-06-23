import { marketing } from './marketing.js';
import { merchantHub } from './merchant-hub.js';
import { signup } from './signup.js';
import { admin } from './admin.js';
import { adminAparencia } from './admin-aparencia.js';
import { adminBanners } from './admin-banners.js';
import { adminCategorias } from './admin-categorias.js';
import { adminCompradores } from './admin-compradores.js';
import { adminConfiguracoes } from './admin-configuracoes.js';
import { adminRelatorios } from './admin-relatorios.js';
import { adminAgenda } from './admin-agenda.js';
import { adminPermissoes } from './admin-permissoes.js';
import { adminChat } from './admin-chat.js';
import { adminDiagnostico } from './admin-diagnostico.js';
import { adminPedidoDetail } from './admin-pedido-detail.js';
import { adminProdutos } from './admin-produtos.js';
import { auth } from './auth.js';
import { platform } from './platform.js';
import { store } from './store.js';

/**
 * Catálogo central de data-testid do produto.
 *
 * Importar como `import { testIds } from '@lojao/test-utils/test-ids'`.
 * Novos grupos (checkout, vitrine...) são adicionados por fase.
 */
export const testIds = {
  auth,
  admin,
  adminCategorias,
  adminBanners,
  adminAparencia,
  adminProdutos,
  adminCompradores,
  adminConfiguracoes,
  adminRelatorios,
  adminAgenda,
  adminPermissoes,
  adminChat,
  adminDiagnostico,
  adminPedidoDetail,
  platform,
  store,
  marketing,
  merchantHub,
  signup,
} as const;

export {
  auth,
  admin,
  adminCategorias,
  adminBanners,
  adminAparencia,
  adminProdutos,
  adminCompradores,
  adminConfiguracoes,
  adminRelatorios,
  adminAgenda,
  adminPermissoes,
  adminChat,
  adminDiagnostico,
  adminPedidoDetail,
  platform,
  store,
  marketing,
  merchantHub,
  signup,
};
