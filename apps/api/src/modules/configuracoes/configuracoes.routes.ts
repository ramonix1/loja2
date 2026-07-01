import type { FastifyInstance } from 'fastify';

import { requireAdmin } from '../../plugins/auth-guard.js';
import {
  getConfiguracoesHandler,
  updateConfiguracoesHandler,
} from './configuracoes.controller.js';

export async function configuracoesRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdmin);

  app.get('/admin/configuracoes', getConfiguracoesHandler);
  app.put('/admin/configuracoes', updateConfiguracoesHandler);
}
