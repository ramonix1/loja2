import type { FastifyInstance } from 'fastify';

import { requireAdmin } from '../../plugins/auth-guard.js';
import { runDiagnostico } from './diagnostico.service.js';

export async function diagnosticoRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdmin);

  app.get('/admin/diagnostico', async (_request, reply) => {
    const resultados = await runDiagnostico();
    return reply.send({ data: { resultados } });
  });
}
