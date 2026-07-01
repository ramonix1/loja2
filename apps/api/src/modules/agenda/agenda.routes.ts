import type { FastifyInstance } from 'fastify';

import { requireAdmin } from '../../plugins/auth-guard.js';
import {
  getAgendaAdminHandler,
  removeAgendaDiaHandler,
  saveAgendaDiaHandler,
  updateAgendaConfigHandler,
} from './agenda.controller.js';

export async function agendaRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdmin);

  app.get('/admin/agenda', getAgendaAdminHandler);
  app.put('/admin/agenda/config', updateAgendaConfigHandler);
  app.put('/admin/agenda/dias', saveAgendaDiaHandler);
  app.delete('/admin/agenda/dias/:data', removeAgendaDiaHandler);
}
