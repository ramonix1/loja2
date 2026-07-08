import type { FastifyInstance } from 'fastify';

import { requireAdmin } from '../../plugins/auth-guard.js';
import { getAgenda, removeDia, saveDia, updateConfig } from './agenda.controller.js';

export async function agendaRouter(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdmin);

  app.get('/admin/agenda', getAgenda);
  app.put('/admin/agenda/config', updateConfig);
  app.put('/admin/agenda/dias', saveDia);
  app.delete('/admin/agenda/dias/:data', removeDia);
}
