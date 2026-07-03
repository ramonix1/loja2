import type { FastifyInstance } from 'fastify';

import { adminRoutes } from '../modules/admin/admin.routes.js';
import { aparenciaRoutes } from '../modules/aparencia/aparencia.routes.js';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { bannersRoutes } from '../modules/banners/banners.routes.js';
import { merchantBillingRoutes } from '../modules/billing/merchant-billing.routes.js';
import { cartRoutes } from '../modules/cart/cart.routes.js';
import { categoriasRoutes } from '../modules/categorias/categorias.routes.js';
import { checkoutRoutes } from '../modules/checkout/checkout.routes.js';
import { configuracoesRoutes } from '../modules/configuracoes/configuracoes.routes.js';
import { compradoresRoutes } from '../modules/compradores/compradores.routes.js';
import { merchantRoutes } from '../modules/merchants/merchant.routes.js';
import { ordersRoutes } from '../modules/orders/orders.routes.js';
import { produtosRoutes } from '../modules/produtos/produtos.routes.js';
import { publicRoutes } from '../modules/public/public.routes.js';
import {
  adminReviewsRoutes,
  publicReviewsRoutes,
  reviewsRoutes,
} from '../modules/reviews/reviews.routes.js';
import { relatoriosRoutes } from '../modules/relatorios/relatorios.routes.js';
import { shippingRoutes } from '../modules/shipping/shipping.routes.js';
import { storeChatRoutes } from '../modules/store-chat/store-chat.routes.js';
import { agendaRoutes } from '../modules/agenda/agenda.routes.js';
import { permissoesRoutes } from '../modules/permissoes/permissoes.routes.js';
import { chatRoutes } from '../modules/chat/chat.routes.js';
import { diagnosticoRoutes } from '../modules/diagnostico/diagnostico.routes.js';
import { platformRoutes } from '../modules/platform/platform.routes.js';
import { storeRoutes } from '../modules/store/store.routes.js';
import { wishlistRoutes } from '../modules/wishlist/wishlist.routes.js';
import {
  publicStorePreHandler,
  softStorePreHandler,
  storePreHandler,
} from '../plugins/store.js';

/** Rotas que operam no master ou em nível de conta — sem loja resolvida. */
function isStoreExempt(path: string): boolean {
  if (path.includes('/platform/')) return true;
  if (path.includes('/public/merchant-signup') || path.includes('/merchants/')) return true;
  if (path.includes('/webhook/')) return true;
  // payment-config é global (chaves Stripe/SumUp)
  if (path.endsWith('/public/payment-config')) return true;
  return false;
}

/** Rotas de auth onde a loja é opcional (conta merchant sem loja selecionada). */
function isSoftStoreAuth(path: string, method: string): boolean {
  if (method === 'POST' && path.endsWith('/auth/login')) return true;
  return (
    path.endsWith('/auth/me') ||
    path.endsWith('/auth/logout') ||
    path.endsWith('/auth/my-stores') ||
    path.endsWith('/auth/select-store') ||
    path.endsWith('/auth/clear-store')
  );
}

/** Vitrine / comprador — resolve loja por `X-Store-Slug` ou path param. */
function isPublicStore(path: string): boolean {
  if (path.includes('/public/')) return true;
  if (path.startsWith('/api/v1/cart')) return true;
  if (path.includes('/checkout')) return true;
  if (path.includes('/shipping/')) return true;
  if (path.includes('/orders')) return true;
  if (path.includes('/chat/mensagens')) return true;
  if (path.includes('/auth/register')) return true;
  if (path.includes('/auth/recover-password')) return true;
  if (path.includes('/auth/reset-password')) return true;
  if (path.endsWith('/store/config')) return true;
  if (path.startsWith('/api/v1/wishlist')) return true;
  if (/^\/api\/v1\/products\/\d+\/reviews$/.test(path)) return true;
  return false;
}

/**
 * MA8 — Agrupa rotas `/api/v1`. O plugin `store` substitui `tenantPreHandler`:
 * admin autenticado usa `session.storeId`; vitrine usa slug da loja.
 */
export async function v1Routes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', async (request, reply) => {
    const path = request.url.split('?')[0]!;

    if (isStoreExempt(path)) return;

    if (isSoftStoreAuth(path, request.method)) {
      return softStorePreHandler(request);
    }

    if (isPublicStore(path)) {
      return publicStorePreHandler(request, reply);
    }

    return storePreHandler(request, reply);
  });

  await app.register(authRoutes);
  await app.register(platformRoutes);
  await app.register(storeRoutes);
  await app.register(publicRoutes);
  await app.register(publicReviewsRoutes);
  await app.register(reviewsRoutes);
  await app.register(wishlistRoutes);
  await app.register(merchantRoutes);
  await app.register(cartRoutes);
  await app.register(shippingRoutes);
  await app.register(checkoutRoutes);
  await app.register(ordersRoutes);
  await app.register(merchantBillingRoutes);
  await app.register(storeChatRoutes);
  await app.register(adminRoutes);
  await app.register(adminReviewsRoutes);
  await app.register(categoriasRoutes);
  await app.register(bannersRoutes);
  await app.register(aparenciaRoutes);
  await app.register(produtosRoutes);
  await app.register(compradoresRoutes);
  await app.register(configuracoesRoutes);
  await app.register(relatoriosRoutes);
  await app.register(agendaRoutes);
  await app.register(permissoesRoutes);
  await app.register(chatRoutes);
  await app.register(diagnosticoRoutes);
}
