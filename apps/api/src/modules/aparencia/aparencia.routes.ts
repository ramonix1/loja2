import type { FastifyInstance } from 'fastify';

import { requireAdmin } from '../../plugins/auth-guard.js';
import { getAparenciaHandler, updateAparenciaHandler } from './aparencia.controller.js';

export async function aparenciaRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdmin);

  app.get('/admin/aparencia', getAparenciaHandler);
  app.put('/admin/aparencia', updateAparenciaHandler);
}
