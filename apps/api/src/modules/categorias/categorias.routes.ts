import { createCategoriaSchema, updateCategoriaSchema } from '@lojao/types/categorias';
import type { FastifyInstance } from 'fastify';

import { requireAdmin } from '../../plugins/auth-guard.js';
import {
  createCategoria,
  deleteCategoria,
  getCategoria,
  listCategorias,
  updateCategoria,
} from './categorias.service.js';

export async function categoriasRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdmin);

  app.get('/admin/categorias', async (request, reply) => {
    const data = await listCategorias(request.db);
    return reply.send({ data });
  });

  app.post('/admin/categorias', async (request, reply) => {
    const parsed = createCategoriaSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Dados inválidos.',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { id } = await createCategoria(request.db, parsed.data);
    return reply.code(201).send({ data: { id } });
  });

  app.get('/admin/categorias/:id', async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isInteger(id) || id < 1) {
      return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
    }

    const data = await getCategoria(request.db, id);
    if (!data) {
      return reply.code(404).send({ error: 'Categoria não encontrada.', code: 'NOT_FOUND' });
    }

    return reply.send({ data });
  });

  app.put('/admin/categorias/:id', async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isInteger(id) || id < 1) {
      return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
    }

    const parsed = updateCategoriaSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Dados inválidos.',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const ok = await updateCategoria(request.db, id, parsed.data);
    if (!ok) {
      return reply.code(404).send({ error: 'Categoria não encontrada.', code: 'NOT_FOUND' });
    }

    return reply.send({ data: { ok: true } });
  });

  app.delete('/admin/categorias/:id', async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isInteger(id) || id < 1) {
      return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
    }

    const ok = await deleteCategoria(request.db, id);
    if (!ok) {
      return reply.code(404).send({ error: 'Categoria não encontrada.', code: 'NOT_FOUND' });
    }

    return reply.send({ data: { ok: true } });
  });
}
