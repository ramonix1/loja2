import type { FastifyReply, FastifyRequest } from 'fastify';

import { createAdminSchema } from './permissoes.schema.js';
import { createAdmin, deleteAdmin, listAdmins, toggleAdmin } from './permissoes.service.js';

export async function listAdminsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const data = await listAdmins(request.db);
  return reply.send({ data });
}

export async function createAdminHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const parsed = createAdminSchema.safeParse(request.body);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? 'Dados inválidos.';
    return reply.code(400).send({
      error: firstError,
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const result = await createAdmin(request.db, parsed.data);
  if (!result.ok) {
    const status = result.code === 'EMAIL_EXISTS' ? 409 : 400;
    return reply.code(status).send({ error: result.message, code: result.code });
  }

  return reply.code(201).send({ data: result.admin });
}

export async function toggleAdminHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const id = Number((request.params as { id: string }).id);
  if (!Number.isInteger(id) || id < 1) {
    return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
  }

  const result = await toggleAdmin(request.db, id, request.session!.usuarioId!);
  if (result === 'self') {
    return reply.code(403).send({
      error: 'Você não pode alterar sua própria conta.',
      code: 'CANNOT_MODIFY_SELF',
    });
  }
  if (result === 'not_found') {
    return reply.code(404).send({ error: 'Administrador não encontrado.', code: 'NOT_FOUND' });
  }

  const data = await listAdmins(request.db);
  return reply.send({ data });
}

export async function deleteAdminHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const id = Number((request.params as { id: string }).id);
  if (!Number.isInteger(id) || id < 1) {
    return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
  }

  const result = await deleteAdmin(request.db, id, request.session!.usuarioId!);
  if (result === 'self') {
    return reply.code(403).send({
      error: 'Você não pode remover sua própria conta.',
      code: 'CANNOT_MODIFY_SELF',
    });
  }
  if (result === 'not_found') {
    return reply.code(404).send({ error: 'Administrador não encontrado.', code: 'NOT_FOUND' });
  }

  return reply.send({ data: { ok: true } });
}
