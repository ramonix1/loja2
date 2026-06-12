import { listCompradoresQuerySchema } from '@lojao/types/compradores';
import type { FastifyInstance } from 'fastify';

import { requireAdmin } from '../../plugins/auth-guard.js';
import { getComprador, listCompradores } from './compradores.service.js';

export async function compradoresRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdmin);

  app.get('/admin/compradores', async (request, reply) => {
    const parsed = listCompradoresQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Parâmetros inválidos.',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { compradores, totais } = await listCompradores(request.db, parsed.data);
    return reply.send({
      data: compradores,
      meta: { totais, busca: parsed.data.busca ?? '' },
    });
  });

  app.get('/admin/compradores/:id', async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isInteger(id) || id < 1) {
      return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
    }

    const data = await getComprador(request.db, id);
    if (!data) {
      return reply.code(404).send({ error: 'Comprador não encontrado.', code: 'NOT_FOUND' });
    }

    return reply.send({ data });
  });
}
