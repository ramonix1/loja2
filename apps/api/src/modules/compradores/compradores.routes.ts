import type { FastifyInstance } from 'fastify';

import { requireAdmin } from '../../plugins/auth-guard.js';
import { getCompradorHandler, listCompradoresHandler } from './compradores.controller.js';

export async function compradoresRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdmin);

  app.get('/admin/compradores', listCompradoresHandler);
  app.get('/admin/compradores/:id', getCompradorHandler);
}
