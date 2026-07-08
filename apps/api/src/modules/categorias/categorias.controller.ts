import { createCategoriaSchema, updateCategoriaSchema } from '@lojao/types/categorias';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { afterStoreMutation } from '../../lib/storefront-revalidate.js';
import { requireStoreScope } from '../../lib/store-scope.js';
import {
  createCategoria,
  deleteCategoria,
  getCategoria,
  listCategorias,
  updateCategoria,
} from './categorias.service.js';

export async function getCategorias(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const data = await listCategorias(requireStoreScope(request));
  return reply.send({ data });
}

export async function createCategoriaHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const parsed = createCategoriaSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({
      error: 'Dados inválidos.',
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const { id } = await createCategoria(requireStoreScope(request), parsed.data);
  afterStoreMutation(request);
  return reply.code(201).send({ data: { id } });
}

export async function getCategoriaById(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const id = Number((request.params as { id: string }).id);
  if (!Number.isInteger(id) || id < 1) {
    return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
  }

  const data = await getCategoria(requireStoreScope(request), id);
  if (!data) {
    return reply.code(404).send({ error: 'Categoria não encontrada.', code: 'NOT_FOUND' });
  }

  return reply.send({ data });
}

export async function updateCategoriaHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
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

  const ok = await updateCategoria(requireStoreScope(request), id, parsed.data);
  if (!ok) {
    return reply.code(404).send({ error: 'Categoria não encontrada.', code: 'NOT_FOUND' });
  }

  afterStoreMutation(request);
  return reply.send({ data: { ok: true } });
}

export async function deleteCategoriaHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const id = Number((request.params as { id: string }).id);
  if (!Number.isInteger(id) || id < 1) {
    return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
  }

  const ok = await deleteCategoria(requireStoreScope(request), id);
  if (!ok) {
    return reply.code(404).send({ error: 'Categoria não encontrada.', code: 'NOT_FOUND' });
  }

  afterStoreMutation(request);
  return reply.send({ data: { ok: true } });
}
