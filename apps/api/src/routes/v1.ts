import type { FastifyInstance } from 'fastify';

import { adminRouter } from '../modules/admin/admin.router.js';
import { aparenciaRouter } from '../modules/aparencia/aparencia.router.js';
import { authRouter } from '../modules/auth/auth.router.js';
import { bannersRouter } from '../modules/banners/banners.router.js';
import { merchantBillingRouter } from '../modules/billing/merchant-billing.router.js';
import { cartRouter } from '../modules/cart/cart.router.js';
import { categoriasRouter } from '../modules/categorias/categorias.router.js';
import { checkoutRouter } from '../modules/checkout/checkout.router.js';
import { configuracoesRouter } from '../modules/configuracoes/configuracoes.router.js';
import { compradoresRouter } from '../modules/compradores/compradores.router.js';
import { merchantRouter } from '../modules/merchants/merchant.router.js';
import { ordersRouter } from '../modules/orders/orders.router.js';
import { produtosRouter } from '../modules/produtos/produtos.router.js';
import { publicRouter } from '../modules/public/public.router.js';
import {
  adminReviewsRouter,
  publicReviewsRouter,
  reviewsRouter,
} from '../modules/reviews/reviews.router.js';
import { relatoriosRouter } from '../modules/relatorios/relatorios.router.js';
import { shippingRouter } from '../modules/shipping/shipping.router.js';
import { storeChatRouter } from '../modules/store-chat/store-chat.router.js';
import { agendaRouter } from '../modules/agenda/agenda.router.js';
import { permissoesRouter } from '../modules/permissoes/permissoes.router.js';
import { chatRouter } from '../modules/chat/chat.router.js';
import { diagnosticoRouter } from '../modules/diagnostico/diagnostico.router.js';
import { platformRouter } from '../modules/platform/platform.router.js';
import { storeRouter } from '../modules/store/store.router.js';
import { wishlistRouter } from '../modules/wishlist/wishlist.router.js';
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

  await app.register(authRouter);
  await app.register(platformRouter);
  await app.register(storeRouter);
  await app.register(publicRouter);
  await app.register(publicReviewsRouter);
  await app.register(reviewsRouter);
  await app.register(wishlistRouter);
  await app.register(merchantRouter);
  await app.register(cartRouter);
  await app.register(shippingRouter);
  await app.register(checkoutRouter);
  await app.register(ordersRouter);
  await app.register(merchantBillingRouter);
  await app.register(storeChatRouter);
  await app.register(adminRouter);
  await app.register(adminReviewsRouter);
  await app.register(categoriasRouter);
  await app.register(bannersRouter);
  await app.register(aparenciaRouter);
  await app.register(produtosRouter);
  await app.register(compradoresRouter);
  await app.register(configuracoesRouter);
  await app.register(relatoriosRouter);
  await app.register(agendaRouter);
  await app.register(permissoesRouter);
  await app.register(chatRouter);
  await app.register(diagnosticoRouter);
}
