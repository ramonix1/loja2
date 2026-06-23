import { aparenciaFieldsSchema } from '@lojao/types/aparencia';
import type { FastifyInstance } from 'fastify';

import { parseMultipartMulti } from '../../lib/multipart.js';
import { UploadError } from '../../lib/image-validation.js';
import { requireAdmin } from '../../plugins/auth-guard.js';
import { getAparencia, updateAparencia } from './aparencia.service.js';

export async function aparenciaRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdmin);

  app.get('/admin/aparencia', async (request, reply) => {
    const data = await getAparencia(request.db);
    return reply.send({ data });
  });

  app.put('/admin/aparencia', async (request, reply) => {
    try {
      const { fields, files } = await parseMultipartMulti(request);
      const parsed = aparenciaFieldsSchema.safeParse({
        loja_nome: fields.loja_nome,
        loja_slogan: fields.loja_slogan,
        loja_cor_primaria: fields.loja_cor_primaria,
        loja_tema: fields.loja_tema,
        loja_rodape: fields.loja_rodape,
        loja_email: fields.loja_email,
        loja_whatsapp: fields.loja_whatsapp,
      });

      if (!parsed.success) {
        return reply.code(400).send({
          error: 'Dados inválidos.',
          code: 'VALIDATION_ERROR',
          details: parsed.error.flatten().fieldErrors,
        });
      }

      await updateAparencia(request.db, request.server.imageStorage, parsed.data, {
        logo: files.logo,
        favicon: files.favicon,
      });

      const data = await getAparencia(request.db);
      return reply.send({ data });
    } catch (err) {
      if (err instanceof UploadError) {
        return reply.code(400).send({ error: err.message, code: 'VALIDATION_ERROR' });
      }
      throw err;
    }
  });
}
