import { dashboardChartsQuerySchema } from '@lojao/types/dashboard';
import { updatePedidoStatusSchema } from '@lojao/types/pedidos';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { requireStoreScope } from '../../lib/store-scope.js';
import { pedidosQuerySchema } from './admin.schemas.js';
import { getDashboardStats, getPedidoById, listPedidos, updatePedidoStatus } from './admin.service.js';
import { getDashboardCharts } from './dashboard-charts.service.js';

export async function getDashboardStatsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const data = await getDashboardStats(requireStoreScope(request));
  return reply.send({ data });
}

export async function getDashboardChartsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const parsed = dashboardChartsQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({
      error: 'Parâmetros inválidos.',
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const data = await getDashboardCharts(requireStoreScope(request), parsed.data.periodo);
  return reply.send({ data });
}

export async function getPedidos(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const parsed = pedidosQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({
      error: 'Parâmetros inválidos.',
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const { page, perPage, status } = parsed.data;
  const { data, total } = await listPedidos(requireStoreScope(request), parsed.data);
  return reply.send({ data, meta: { page, perPage, total, ...(status ? { status } : {}) } });
}

export async function getPedido(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const id = Number((request.params as { id: string }).id);
  if (!Number.isInteger(id) || id < 1) {
    return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
  }

  const data = await getPedidoById(requireStoreScope(request), id);
  if (!data) {
    return reply.code(404).send({ error: 'Pedido não encontrado.', code: 'NOT_FOUND' });
  }

  return reply.send({ data });
}

export async function patchPedidoStatus(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
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

  const data = await updatePedidoStatus(requireStoreScope(request), id, parsed.data);
  if (!data) {
    return reply.code(404).send({ error: 'Pedido não encontrado.', code: 'NOT_FOUND' });
  }

  return reply.send({ data });
}
