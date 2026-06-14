import { updateConfiguracoesSchema } from '@lojao/types/configuracoes';
import type { FastifyInstance } from 'fastify';

import { requireAdmin } from '../../plugins/auth-guard.js';
import { getConfiguracoes, updateConfiguracoes } from './configuracoes.service.js';

export async function configuracoesRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdmin);

  app.get('/admin/configuracoes', async (request, reply) => {
    const data = await getConfiguracoes(request.db);
    return reply.send({ data });
  });

  app.put('/admin/configuracoes', async (request, reply) => {
    const parsed = updateConfiguracoesSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Dados inválidos.',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const data = await updateConfiguracoes(request.db, parsed.data);
    return reply.send({ data });
  });
}
