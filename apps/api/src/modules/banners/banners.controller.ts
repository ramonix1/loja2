import { bannerFieldsSchema } from '@lojao/types/banners';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { UploadError } from '../../lib/image-validation.js';
import { parseMultipart } from '../../lib/multipart.js';
import { afterStoreMutation } from '../../lib/storefront-revalidate.js';
import { requireStoreScope } from '../../lib/store-scope.js';
import {
  createBanner,
  deleteBanner,
  getBanner,
  listBanners,
  listProdutoOptions,
  toggleBannerAtivo,
  updateBanner,
} from './banners.service.js';

function parseBannerFields(fields: Record<string, string>) {
  const ativoRaw = fields.ativo;
  const ativo =
    ativoRaw === 'true' || ativoRaw === 'on' || ativoRaw === '1' || ativoRaw === undefined
      ? true
      : ativoRaw === 'false' || ativoRaw === 'off' || ativoRaw === '0'
        ? false
        : true;

  return bannerFieldsSchema.safeParse({
    titulo: fields.titulo,
    subtitulo: fields.subtitulo || null,
    cta_texto: fields.cta_texto || 'Ver oferta',
    cta_url: fields.cta_url || null,
    produto_id: fields.produto_id && fields.produto_id !== '' ? fields.produto_id : null,
    ativo,
    ordem: fields.ordem ?? 0,
  });
}

export async function getBanners(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const data = await listBanners(requireStoreScope(request));
  return reply.send({ data });
}

export async function getFormOptions(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const produtos = await listProdutoOptions(requireStoreScope(request));
  return reply.send({ data: { produtos } });
}

export async function getBannerById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const id = Number((request.params as { id: string }).id);
  if (!Number.isInteger(id) || id < 1) {
    return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
  }

  const data = await getBanner(requireStoreScope(request), id);
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

    const { id } = await createBanner(
      requireStoreScope(request),
      request.server.imageStorage,
      parsed.data,
      file,
    );
    afterStoreMutation(request);
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

    const ok = await updateBanner(
      requireStoreScope(request),
      request.server.imageStorage,
      id,
      parsed.data,
      file,
    );
    if (!ok) {
      return reply.code(404).send({ error: 'Banner não encontrado.', code: 'NOT_FOUND' });
    }

    afterStoreMutation(request);
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

  const ok = await deleteBanner(requireStoreScope(request), request.server.imageStorage, id);
  if (!ok) {
    return reply.code(404).send({ error: 'Banner não encontrado.', code: 'NOT_FOUND' });
  }

  afterStoreMutation(request);
  return reply.send({ data: { ok: true } });
}

export async function toggleAtivoBanner(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const id = Number((request.params as { id: string }).id);
  if (!Number.isInteger(id) || id < 1) {
    return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
  }

  const ok = await toggleBannerAtivo(requireStoreScope(request), id);
  if (!ok) {
    return reply.code(404).send({ error: 'Banner não encontrado.', code: 'NOT_FOUND' });
  }

  afterStoreMutation(request);
  return reply.send({ data: { ok: true } });
}
