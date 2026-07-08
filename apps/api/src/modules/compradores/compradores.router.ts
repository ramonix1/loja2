import type { FastifyInstance } from 'fastify';

import { requireAdmin } from '../../plugins/auth-guard.js';
import { getCompradorById, getCompradores } from './compradores.controller.js';

export async function compradoresRouter(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdmin);

  app.get('/admin/compradores', getCompradores);
  app.get('/admin/compradores/:id', getCompradorById);
}
