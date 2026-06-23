import type { FastifyInstance } from 'fastify';

import { adminRoutes } from '../modules/admin/admin.routes.js';
import { aparenciaRoutes } from '../modules/aparencia/aparencia.routes.js';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { bannersRoutes } from '../modules/banners/banners.routes.js';
import { billingRoutes } from '../modules/billing/billing.routes.js';
import { cartRoutes } from '../modules/cart/cart.routes.js';
import { categoriasRoutes } from '../modules/categorias/categorias.routes.js';
import { checkoutRoutes } from '../modules/checkout/checkout.routes.js';
import { configuracoesRoutes } from '../modules/configuracoes/configuracoes.routes.js';
import { compradoresRoutes } from '../modules/compradores/compradores.routes.js';
import { ordersRoutes } from '../modules/orders/orders.routes.js';
import { produtosRoutes } from '../modules/produtos/produtos.routes.js';
import { publicRoutes } from '../modules/public/public.routes.js';
import { signupRoutes } from '../modules/public/signup.routes.js';
import { relatoriosRoutes } from '../modules/relatorios/relatorios.routes.js';
import { shippingRoutes } from '../modules/shipping/shipping.routes.js';
import { storeChatRoutes } from '../modules/store-chat/store-chat.routes.js';
import { agendaRoutes } from '../modules/agenda/agenda.routes.js';
import { permissoesRoutes } from '../modules/permissoes/permissoes.routes.js';
import { chatRoutes } from '../modules/chat/chat.routes.js';
import { diagnosticoRoutes } from '../modules/diagnostico/diagnostico.routes.js';
import { platformRoutes } from '../modules/platform/platform.routes.js';
import { tenantRoutes } from '../modules/tenant/tenant.routes.js';
import {
  loginTenantPreHandler,
  softTenantPreHandler,
  tenantPreHandler,
} from '../plugins/tenant.js';

/**
 * Agrupa as rotas `/api/v1`. O `tenantPreHandler` roda antes de toda rota deste
 * escopo (após o load de sessão, que é global), injetando `request.db`.
 */
export async function v1Routes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', async (request, reply) => {
    const path = request.url.split('?')[0]!;

    // Platform Hub: opera no banco master; sem tenant (guard próprio).
    if (path.includes('/platform/')) return;

    // Onboarding self-service (Fase G): API pública sem tenant resolvido.
    if (path.includes('/public/signup')) return;

    // Login lojista: resolve tenant a partir do body (slug explícito) ou hub cross-tenant.
    if (request.method === 'POST' && path.endsWith('/auth/login')) {
      return loginTenantPreHandler(request, reply);
    }

    // Merchant Hub + introspecção/logout: tenant opcional.
    if (
      path.endsWith('/auth/me') ||
      path.endsWith('/auth/logout') ||
      path.endsWith('/auth/my-stores') ||
      path.endsWith('/auth/select-tenant') ||
      path.endsWith('/auth/clear-tenant')
    ) {
      return softTenantPreHandler(request);
    }

    return tenantPreHandler(request, reply);
  });

  await app.register(authRoutes);
  await app.register(platformRoutes);
  await app.register(tenantRoutes);
  await app.register(publicRoutes);
  await app.register(signupRoutes);
  await app.register(cartRoutes);
  await app.register(shippingRoutes);
  await app.register(checkoutRoutes);
  await app.register(ordersRoutes);
  await app.register(billingRoutes);
  await app.register(storeChatRoutes);
  await app.register(adminRoutes);
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
