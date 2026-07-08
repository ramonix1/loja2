import type { FastifyInstance } from 'fastify';

import { requireAdmin } from '../../plugins/auth-guard.js';
import { getDiagnostico } from './diagnostico.controller.js';

export async function diagnosticoRouter(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdmin);

  app.get('/admin/diagnostico', getDiagnostico);
}
