import type { FastifyInstance } from 'fastify';

import { requireAdmin } from '../../plugins/auth-guard.js';
import { getRelatorios, getRelatoriosCsv } from './relatorios.controller.js';

export async function relatoriosRouter(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdmin);

  app.get('/admin/relatorios', getRelatorios);
  app.get('/admin/relatorios/csv/:tipo', getRelatoriosCsv);
}
