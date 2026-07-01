import type { FastifyInstance } from 'fastify';

import { requireAdmin } from '../../plugins/auth-guard.js';
import {
  createAdminHandler,
  deleteAdminHandler,
  listAdminsHandler,
  toggleAdminHandler,
} from './permissoes.controller.js';

export async function permissoesRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdmin);

  app.get('/admin/permissoes', listAdminsHandler);
  app.post('/admin/permissoes', createAdminHandler);
  app.patch('/admin/permissoes/:id/toggle', toggleAdminHandler);
  app.delete('/admin/permissoes/:id', deleteAdminHandler);
}
