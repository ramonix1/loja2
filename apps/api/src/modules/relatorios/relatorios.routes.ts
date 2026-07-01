import type { FastifyInstance } from 'fastify';

import { requireAdmin } from '../../plugins/auth-guard.js';
import { getRelatorioCsvHandler, getRelatorioHandler } from './relatorios.controller.js';

export async function relatoriosRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdmin);

  app.get('/admin/relatorios', getRelatorioHandler);
  app.get('/admin/relatorios/csv/:tipo', getRelatorioCsvHandler);
}
