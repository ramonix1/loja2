import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { getConfigs } from '../../lib/config.js';
import { requireAuth } from '../../plugins/auth-guard.js';
import { calcularOpcoesFrete } from '../../services/frete.service.js';

const calculateSchema = z.object({
  cep_destino: z.string().min(8),
  subtotal: z.number().min(0).optional(),
});

export async function shippingRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.post('/shipping/calculate', async (request, reply) => {
    const parsed = calculateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Dados inválidos.',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    try {
      const configs = await getConfigs(request.db);
      const opcoes = await calcularOpcoesFrete({
        cepDestino: parsed.data.cep_destino,
        subtotal: parsed.data.subtotal ?? 0,
        configs,
      });
      return reply.send({ data: { opcoes } });
    } catch (err) {
      return reply.code(400).send({
        error: err instanceof Error ? err.message : 'Erro ao calcular frete.',
        code: 'SHIPPING_ERROR',
      });
    }
  });
}
