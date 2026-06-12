import type { FastifyInstance } from 'fastify';

import { loginSchema } from './auth.schemas.js';
import { login } from './auth.service.js';

/**
 * Rotas de autenticação. Espelham os campos de sessão de
 * `authController.processarLogin`/`logout` para manter compatibilidade com o
 * legacy (mesmo cookie `lojao.sid`).
 */
export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/auth/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Dados inválidos.',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const result = await login(request.db, parsed.data, request.ip);
    if (!result.ok) {
      return reply
        .code(401)
        .send({ error: 'Email ou senha incorretos.', code: 'UNAUTHORIZED' });
    }

    // Regenera a sessão (anti session fixation) preservando o tenant.
    const tenantSlug = request.session.tenantSlug ?? request.tenantSlug;
    await request.session.regenerate();
    if (tenantSlug) request.session.tenantSlug = tenantSlug;
    if (request.tenantId !== undefined) request.session.tenant_id = request.tenantId;
    request.session.usuarioId = result.usuario.id;
    request.session.nome = result.usuario.nome;
    request.session.email = result.usuario.email;
    request.session.role = result.usuario.role;
    await request.session.save();

    return reply.send({
      data: {
        id: result.usuario.id,
        nome: result.usuario.nome,
        email: result.usuario.email,
        role: result.usuario.role,
      },
    });
  });

  app.post('/auth/logout', async (request, reply) => {
    await request.session.destroy();
    return reply.send({ data: { ok: true } });
  });

  app.get('/auth/me', async (request, reply) => {
    if (!request.session.usuarioId) {
      return reply.code(401).send({ error: 'Não autenticado.', code: 'UNAUTHORIZED' });
    }

    return reply.send({
      data: {
        usuario: {
          id: request.session.usuarioId,
          nome: request.session.nome,
          role: request.session.role,
        },
        tenant: { slug: request.tenantSlug },
      },
    });
  });
}
