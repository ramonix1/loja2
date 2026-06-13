import type { FastifyRequest } from 'fastify';
import type { FastifyInstance } from 'fastify';

import {
  loginSchema,
  recoverPasswordSchema,
  registerSchema,
  resetPasswordSchema,
} from './auth.schemas.js';
import { isResetTokenValid, login, recoverPassword, register, resetPassword } from './auth.service.js';

async function populateSession(
  request: FastifyRequest,
  usuario: { id: number; nome: string; email: string; role: string },
): Promise<void> {
  const tenantSlug = request.session.tenantSlug ?? request.tenantSlug;
  await request.session.regenerate();
  if (tenantSlug) request.session.tenantSlug = tenantSlug;
  if (request.tenantId !== undefined) request.session.tenant_id = request.tenantId;
  request.session.usuarioId = usuario.id;
  request.session.nome = usuario.nome;
  request.session.email = usuario.email;
  request.session.role = usuario.role as 'admin' | 'usuario';
  await request.session.save();
}

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

    const result = await login(request.drizzle, parsed.data, request.ip);
    if (!result.ok) {
      return reply
        .code(401)
        .send({ error: 'Email ou senha incorretos.', code: 'UNAUTHORIZED' });
    }

    await populateSession(request, result.usuario);

    return reply.send({
      data: {
        id: result.usuario.id,
        nome: result.usuario.nome,
        email: result.usuario.email,
        role: result.usuario.role,
      },
    });
  });

  app.post('/auth/register', async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Dados inválidos.',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const result = await register(request.drizzle, parsed.data);
    if (!result.ok) {
      const message =
        result.code === 'EMAIL_EXISTS' ? 'Este email já está cadastrado.' : 'Dados inválidos.';
      return reply.code(400).send({ error: message, code: result.code });
    }

    return reply.code(201).send({ data: result.usuario });
  });

  app.post('/auth/recover-password', async (request, reply) => {
    const parsed = recoverPasswordSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Dados inválidos.',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    await recoverPassword(request.drizzle, parsed.data);
    return reply.send({
      data: {
        message:
          'Se o email estiver cadastrado, você receberá um link de redefinição em instantes.',
      },
    });
  });

  app.get('/auth/reset-password/:token', async (request, reply) => {
    const token = (request.params as { token: string }).token;
    const valid = await isResetTokenValid(request.drizzle, token);
    if (!valid) {
      return reply.code(404).send({ error: 'Link inválido ou expirado.', code: 'INVALID_TOKEN' });
    }
    return reply.send({ data: { valid: true } });
  });

  app.post('/auth/reset-password/:token', async (request, reply) => {
    const token = (request.params as { token: string }).token;
    const parsed = resetPasswordSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Dados inválidos.',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const result = await resetPassword(request.drizzle, token, parsed.data);
    if (!result.ok) {
      return reply.code(404).send({ error: 'Link inválido ou expirado.', code: 'INVALID_TOKEN' });
    }

    return reply.send({ data: { ok: true } });
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
          email: request.session.email,
          role: request.session.role,
        },
        tenant: { slug: request.tenantSlug },
      },
    });
  });
}
