import { bannerFieldsSchema } from '@lojao/types/banners';
import type { FastifyInstance } from 'fastify';

import { parseMultipart } from '../../lib/multipart.js';
import { UploadError } from '../../lib/upload.js';
import { requireAdmin } from '../../plugins/auth-guard.js';
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

export async function bannersRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdmin);

  app.get('/admin/banners', async (request, reply) => {
    const data = await listBanners(request.db);
    return reply.send({ data });
  });

  app.get('/admin/banners/form-options', async (request, reply) => {
    const produtos = await listProdutoOptions(request.db);
    return reply.send({ data: { produtos } });
  });

  app.get('/admin/banners/:id', async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isInteger(id) || id < 1) {
      return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
    }

    const data = await getBanner(request.db, id);
    if (!data) {
      return reply.code(404).send({ error: 'Banner não encontrado.', code: 'NOT_FOUND' });
    }

    return reply.send({ data });
  });

  app.post('/admin/banners', async (request, reply) => {
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

      const { id } = await createBanner(request.db, parsed.data, file);
      return reply.code(201).send({ data: { id } });
    } catch (err) {
      if (err instanceof UploadError) {
        return reply.code(400).send({ error: err.message, code: 'VALIDATION_ERROR' });
      }
      throw err;
    }
  });

  app.put('/admin/banners/:id', async (request, reply) => {
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

      const ok = await updateBanner(request.db, id, parsed.data, file);
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
  });

  app.delete('/admin/banners/:id', async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isInteger(id) || id < 1) {
      return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
    }

    const ok = await deleteBanner(request.db, id);
    if (!ok) {
      return reply.code(404).send({ error: 'Banner não encontrado.', code: 'NOT_FOUND' });
    }

    return reply.send({ data: { ok: true } });
  });

  app.patch('/admin/banners/:id/toggle-ativo', async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isInteger(id) || id < 1) {
      return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
    }

    const ok = await toggleBannerAtivo(request.db, id);
    if (!ok) {
      return reply.code(404).send({ error: 'Banner não encontrado.', code: 'NOT_FOUND' });
    }

    return reply.send({ data: { ok: true } });
  });
}
