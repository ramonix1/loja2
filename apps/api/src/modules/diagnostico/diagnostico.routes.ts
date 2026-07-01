import type { FastifyInstance } from 'fastify';

import { requireAdmin } from '../../plugins/auth-guard.js';
import { getDiagnosticoHandler } from './diagnostico.controller.js';

export async function diagnosticoRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdmin);

  app.get('/admin/diagnostico', getDiagnosticoHandler);
}
