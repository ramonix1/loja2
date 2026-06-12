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
import { produtosRoutes } from '../modules/produtos/produtos.routes.js';
import { publicRoutes } from '../modules/public/public.routes.js';
import { relatoriosRoutes } from '../modules/relatorios/relatorios.routes.js';
import { shippingRoutes } from '../modules/shipping/shipping.routes.js';
import { storeChatRoutes } from '../modules/store-chat/store-chat.routes.js';
import { agendaRoutes } from '../modules/agenda/agenda.routes.js';
import { permissoesRoutes } from '../modules/permissoes/permissoes.routes.js';
import { chatRoutes } from '../modules/chat/chat.routes.js';
import { diagnosticoRoutes } from '../modules/diagnostico/diagnostico.routes.js';
import { tenantRoutes } from '../modules/tenant/tenant.routes.js';
import { tenantPreHandler } from '../plugins/tenant.js';

/**
 * Agrupa as rotas `/api/v1`. O `tenantPreHandler` roda antes de toda rota deste
 * escopo (após o load de sessão, que é global), injetando `request.db`.
 */
export async function v1Routes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', tenantPreHandler);

  await app.register(authRoutes);
  await app.register(tenantRoutes);
  await app.register(publicRoutes);
  await app.register(cartRoutes);
  await app.register(shippingRoutes);
  await app.register(checkoutRoutes);
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
