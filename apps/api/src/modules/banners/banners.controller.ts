import type { FastifyReply, FastifyRequest } from 'fastify';

import { UploadError } from '../../lib/image-validation.js';
import { parseMultipart } from '../../lib/multipart.js';
import { parseBannerFields } from './banners.schema.js';
import {
  createBanner,
  deleteBanner,
  getBanner,
  listBanners,
  listProdutoOptions,
  toggleBannerAtivo,
  updateBanner,
} from './banners.service.js';

export async function listBannersHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const data = await listBanners(request.db);
  return reply.send({ data });
}

export async function listBannerFormOptionsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const produtos = await listProdutoOptions(request.db);
  return reply.send({ data: { produtos } });
}

export async function getBannerHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const id = Number((request.params as { id: string }).id);
  if (!Number.isInteger(id) || id < 1) {
    return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
  }

  const data = await getBanner(request.db, id);
  if (!data) {
    return reply.code(404).send({ error: 'Banner não encontrado.', code: 'NOT_FOUND' });
  }

  return reply.send({ data });
}

export async function createBannerHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const { fields, file } = await parseMultipart(request);
    if (!file) {
      return reply.code(400).send({
        error: 'Imagem obrigatória para o banner.',
        code: 'VALIDATION_ERROR',
      });
    }

    const parsed = parseBannerFields(fields);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Dados inválidos.',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { id } = await createBanner(request.db, request.server.imageStorage, parsed.data, file);
    return reply.code(201).send({ data: { id } });
  } catch (err) {
    if (err instanceof UploadError) {
      return reply.code(400).send({ error: err.message, code: 'VALIDATION_ERROR' });
    }
    throw err;
  }
}

export async function updateBannerHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const id = Number((request.params as { id: string }).id);
  if (!Number.isInteger(id) || id < 1) {
    return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
  }

  try {
    const { fields, file } = await parseMultipart(request);
    const parsed = parseBannerFields(fields);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Dados inválidos.',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const ok = await updateBanner(request.db, request.server.imageStorage, id, parsed.data, file);
    if (!ok) {
      return reply.code(404).send({ error: 'Banner não encontrado.', code: 'NOT_FOUND' });
    }

    return reply.send({ data: { ok: true } });
  } catch (err) {
    if (err instanceof UploadError) {
      return reply.code(400).send({ error: err.message, code: 'VALIDATION_ERROR' });
    }
    throw err;
  }
}

export async function deleteBannerHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const id = Number((request.params as { id: string }).id);
  if (!Number.isInteger(id) || id < 1) {
    return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
  }

  const ok = await deleteBanner(request.db, request.server.imageStorage, id);
  if (!ok) {
    return reply.code(404).send({ error: 'Banner não encontrado.', code: 'NOT_FOUND' });
  }

  return reply.send({ data: { ok: true } });
}

export async function toggleBannerAtivoHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const id = Number((request.params as { id: string }).id);
  if (!Number.isInteger(id) || id < 1) {
    return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
  }

  const ok = await toggleBannerAtivo(request.db, id);
  if (!ok) {
    return reply.code(404).send({ error: 'Banner não encontrado.', code: 'NOT_FOUND' });
  }

  return reply.send({ data: { ok: true } });
}
