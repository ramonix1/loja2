import { dashboardChartsQuerySchema } from '@lojao/types/dashboard';
import { updatePedidoStatusSchema } from '@lojao/types/pedidos';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { pedidosQuerySchema } from './admin.schema.js';
import {
  getDashboardCharts,
  getDashboardStats,
  getPedidoById,
  listPedidos,
  updatePedidoStatus,
} from './admin.service.js';

export async function getDashboardStatsHandler(request: FastifyRequest, reply: FastifyReply) {
  const data = await getDashboardStats(request.db);
  return reply.send({ data });
}

export async function getDashboardChartsHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = dashboardChartsQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({
      error: 'Parâmetros inválidos.',
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const data = await getDashboardCharts(request.db, parsed.data.periodo);
  return reply.send({ data });
}

export async function listPedidosHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = pedidosQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({
      error: 'Parâmetros inválidos.',
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const { page, perPage, status } = parsed.data;
  const { data, total } = await listPedidos(request.drizzle, parsed.data);

  return reply.send({ data, meta: { page, perPage, total, ...(status ? { status } : {}) } });
}

export async function getPedidoByIdHandler(request: FastifyRequest, reply: FastifyReply) {
  const id = Number((request.params as { id: string }).id);
  if (!Number.isInteger(id) || id < 1) {
    return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
  }

  const data = await getPedidoById(request.db, id);
  if (!data) {
    return reply.code(404).send({ error: 'Pedido não encontrado.', code: 'NOT_FOUND' });
  }

  return reply.send({ data });
}

export async function updatePedidoStatusHandler(request: FastifyRequest, reply: FastifyReply) {
  const id = Number((request.params as { id: string }).id);
  if (!Number.isInteger(id) || id < 1) {
    return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
  }

  const parsed = updatePedidoStatusSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({
      error: 'Dados inválidos.',
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const data = await updatePedidoStatus(request.db, id, parsed.data);
  if (!data) {
    return reply.code(404).send({ error: 'Pedido não encontrado.', code: 'NOT_FOUND' });
  }

  return reply.send({ data });
}
