import {
  agendaQuerySchema,
  saveAgendaDiaSchema,
  updateAgendaConfigSchema,
} from '@lojao/types/agenda';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { requireStoreScope } from '../../lib/store-scope.js';
import {
  getAgendaAdmin,
  removeAgendaDia,
  saveAgendaDia,
  updateAgendaConfig,
} from './agenda.service.js';

export async function getAgenda(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const parsed = agendaQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({
      error: 'Parâmetros inválidos.',
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const data = await getAgendaAdmin(requireStoreScope(request), parsed.data.mes);
  return reply.send({ data });
}

export async function updateConfig(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const parsed = updateAgendaConfigSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({
      error: 'Dados inválidos.',
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const config = await updateAgendaConfig(requireStoreScope(request), parsed.data);
  return reply.send({ data: { config } });
}

export async function saveDia(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const parsed = saveAgendaDiaSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({
      error: 'Dados inválidos.',
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  await saveAgendaDia(requireStoreScope(request), parsed.data);
  return reply.code(200).send({ data: { ok: true } });
}

export async function removeDia(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const data = (request.params as { data: string }).data;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return reply.code(400).send({
      error: 'Data inválida.',
      code: 'VALIDATION_ERROR',
    });
  }

  const removed = await removeAgendaDia(requireStoreScope(request), data);
  if (!removed) {
    return reply.code(404).send({
      error: 'Dia especial não encontrado.',
      code: 'NOT_FOUND',
    });
  }

  return reply.send({ data: { ok: true } });
}
