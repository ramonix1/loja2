import {
  agendaQuerySchema,
  saveAgendaDiaSchema,
  updateAgendaConfigSchema,
} from '@lojao/types/agenda';
import type { FastifyInstance } from 'fastify';

import { requireAdmin } from '../../plugins/auth-guard.js';
import {
  getAgendaAdmin,
  removeAgendaDia,
  saveAgendaDia,
  updateAgendaConfig,
} from './agenda.service.js';

export async function agendaRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdmin);

  app.get('/admin/agenda', async (request, reply) => {
    const parsed = agendaQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Parâmetros inválidos.',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const data = await getAgendaAdmin(request.db, parsed.data.mes);
    return reply.send({ data });
  });

  app.put('/admin/agenda/config', async (request, reply) => {
    const parsed = updateAgendaConfigSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Dados inválidos.',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const config = await updateAgendaConfig(request.db, parsed.data);
    return reply.send({ data: { config } });
  });

  app.put('/admin/agenda/dias', async (request, reply) => {
    const parsed = saveAgendaDiaSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Dados inválidos.',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    await saveAgendaDia(request.db, parsed.data);
    return reply.code(200).send({ data: { ok: true } });
  });

  app.delete('/admin/agenda/dias/:data', async (request, reply) => {
    const data = (request.params as { data: string }).data;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return reply.code(400).send({
        error: 'Data inválida.',
        code: 'VALIDATION_ERROR',
      });
    }

    const removed = await removeAgendaDia(request.db, data);
    if (!removed) {
      return reply.code(404).send({
        error: 'Dia especial não encontrado.',
        code: 'NOT_FOUND',
      });
    }

    return reply.send({ data: { ok: true } });
  });
}
