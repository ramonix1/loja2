import type { FastifyRequest } from 'fastify';
import type { FastifyInstance } from 'fastify';

import { findAdminTenantsWithEmail } from '../../lib/resolve-login-tenant.js';
import { getTenant } from '../../lib/tenant-db.js';
import { requireMerchantAdmin } from '../../plugins/auth-guard.js';
import {
  loginSchema,
  recoverPasswordSchema,
  registerSchema,
  resetPasswordSchema,
  selectTenantSchema,
} from './auth.schemas.js';
import {
  isResetTokenValid,
  login,
  loginMerchantHub,
  recoverPassword,
  register,
  resetPassword,
  resolveAdminInTenant,
} from './auth.service.js';

function userPayload(usuario: {
  id?: number;
  nome: string;
  email: string;
  role: string;
}): Record<string, unknown> {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    role: usuario.role,
  };
}

async function populateFullSession(
  request: FastifyRequest,
  usuario: { id: number; nome: string; email: string; role: string },
  tenantSlug: string,
  tenantId: number,
): Promise<void> {
  await request.session.regenerate();
  request.session.tenantSlug = tenantSlug;
  request.session.tenant_id = tenantId;
  request.session.usuarioId = usuario.id;
  request.session.nome = usuario.nome;
  request.session.email = usuario.email;
  request.session.role = usuario.role as 'admin' | 'usuario' | 'platform_admin';
  await request.session.save();
}

async function populatePartialSession(
  request: FastifyRequest,
  usuario: { nome: string; email: string; role: string },
): Promise<void> {
  await request.session.regenerate();
  request.session.usuarioId = null;
  request.session.tenantSlug = undefined;
  request.session.tenant_id = undefined;
  request.session.nome = usuario.nome;
  request.session.email = usuario.email;
  request.session.role = usuario.role as 'admin' | 'usuario' | 'platform_admin';
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

    const hasExplicitSlug = Boolean(parsed.data.tenantSlug?.trim());

    if (!hasExplicitSlug) {
      const hubResult = await loginMerchantHub(parsed.data, request.ip);
      if (!hubResult.ok) {
        if (hubResult.code === 'NO_TENANT_ACCESS') {
          return reply.code(403).send({
            error: 'Nenhuma loja encontrada para este e-mail.',
            code: 'NO_TENANT_ACCESS',
          });
        }
        return reply
          .code(401)
          .send({ error: 'Email ou senha incorretos.', code: 'UNAUTHORIZED' });
      }

      if (hubResult.step === 'ready') {
        const { tenant } = await getTenant(hubResult.tenant.slug);
        await populateFullSession(
          request,
          hubResult.usuario,
          hubResult.tenant.slug,
          tenant.id,
        );
        return reply.send({
          data: {
            step: 'ready',
            tenant: hubResult.tenant,
            user: userPayload(hubResult.usuario),
          },
        });
      }

      await populatePartialSession(request, hubResult.usuario);
      return reply.send({
        data: {
          step: 'select_tenant',
          stores: hubResult.stores,
          user: userPayload(hubResult.usuario),
        },
      });
    }

    if (!request.drizzle) {
      return reply.code(400).send({
        error: 'Informe o slug da loja.',
        code: 'TENANT_SLUG_REQUIRED',
      });
    }

    const result = await login(request.drizzle, parsed.data, request.ip);
    if (!result.ok) {
      return reply
        .code(401)
        .send({ error: 'Email ou senha incorretos.', code: 'UNAUTHORIZED' });
    }

    await populateFullSession(
      request,
      result.usuario,
      request.tenantSlug!,
      request.tenantId!,
    );

    const { tenant } = await getTenant(request.tenantSlug!);
    return reply.send({
      data: {
        step: 'ready',
        tenant: { slug: tenant.slug, lojaNome: tenant.nome },
        user: userPayload(result.usuario),
      },
    });
  });

  app.post('/auth/select-tenant', { preHandler: requireMerchantAdmin }, async (request, reply) => {
    const parsed = selectTenantSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Dados inválidos.',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const email = request.session.email!;
    const resolved = await resolveAdminInTenant(email, parsed.data.tenantSlug);
    if (!resolved.ok) {
      return reply.code(403).send({
        error: 'Você não tem acesso a esta loja.',
        code: 'FORBIDDEN',
      });
    }

    await populateFullSession(
      request,
      resolved.usuario,
      parsed.data.tenantSlug,
      resolved.tenantId,
    );

    return reply.send({
      data: {
        tenant: { slug: parsed.data.tenantSlug, lojaNome: resolved.lojaNome },
      },
    });
  });

  app.get('/auth/my-stores', { preHandler: requireMerchantAdmin }, async (request, reply) => {
    const stores = await findAdminTenantsWithEmail(request.session.email!);
    return reply.send({
      data: {
        stores: stores.map((s) => ({ slug: s.slug, lojaNome: s.nome })),
      },
    });
  });

  app.post('/auth/clear-tenant', { preHandler: requireMerchantAdmin }, async (request, reply) => {
    request.session.tenantSlug = undefined;
    request.session.tenant_id = undefined;
    request.session.usuarioId = null;
    await request.session.save();
    return reply.send({ data: { ok: true } });
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
    const hasSession =
      request.session.usuarioId || (request.session.email && request.session.role === 'admin');
    if (!hasSession) {
      return reply.code(401).send({ error: 'Não autenticado.', code: 'UNAUTHORIZED' });
    }

    const slug = request.session.tenantSlug ?? request.tenantSlug;
    let lojaNome = '';
    if (slug) {
      try {
        const { tenant } = await getTenant(slug);
        lojaNome = tenant.nome;
      } catch {
        lojaNome = slug;
      }
    }

    return reply.send({
      data: {
        usuario: {
          id: request.session.usuarioId ?? undefined,
          nome: request.session.nome,
          email: request.session.email,
          role: request.session.role,
        },
        tenant: slug ? { slug, lojaNome } : null,
      },
    });
  });
}
