import { createAdminSchema } from '@lojao/types/permissoes';
import type { FastifyInstance } from 'fastify';

import { requireAdmin } from '../../plugins/auth-guard.js';
import { createAdmin, deleteAdmin, listAdmins, toggleAdmin } from './permissoes.service.js';

export async function permissoesRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdmin);

  app.get('/admin/permissoes', async (request, reply) => {
    const data = await listAdmins(request.db);
    return reply.send({ data });
  });

  app.post('/admin/permissoes', async (request, reply) => {
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
  });

  app.patch('/admin/permissoes/:id/toggle', async (request, reply) => {
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
  });

  app.delete('/admin/permissoes/:id', async (request, reply) => {
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
  });
}
