import type { FastifyReply, FastifyRequest } from 'fastify';

import { findAdminTenantsWithEmail } from '../../lib/resolve-login-tenant.js';
import { getTenant } from '../../lib/tenant-db.js';
import {
  loginSchema,
  recoverPasswordSchema,
  registerSchema,
  resetPasswordSchema,
  selectTenantSchema,
} from './auth.schema.js';
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

export async function loginHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const parsed = loginSchema.safeParse(request.body);
  if (!parsed.success) {
    reply.code(400).send({
      error: 'Dados inválidos.',
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const hasExplicitSlug = Boolean(parsed.data.tenantSlug?.trim());

  if (!hasExplicitSlug) {
    const hubResult = await loginMerchantHub(parsed.data, request.ip);
    if (!hubResult.ok) {
      if (hubResult.code === 'NO_TENANT_ACCESS') {
        reply.code(403).send({
          error: 'Nenhuma loja encontrada para este e-mail.',
          code: 'NO_TENANT_ACCESS',
        });
        return;
      }
      reply.code(401).send({ error: 'Email ou senha incorretos.', code: 'UNAUTHORIZED' });
      return;
    }

    if (hubResult.step === 'ready') {
      const { tenant } = await getTenant(hubResult.tenant.slug);
      await populateFullSession(
        request,
        hubResult.usuario,
        hubResult.tenant.slug,
        tenant.id,
      );
      reply.send({
        data: {
          step: 'ready',
          tenant: hubResult.tenant,
          user: userPayload(hubResult.usuario),
        },
      });
      return;
    }

    await populatePartialSession(request, hubResult.usuario);
    reply.send({
      data: {
        step: 'select_tenant',
        stores: hubResult.stores,
        user: userPayload(hubResult.usuario),
      },
    });
    return;
  }

  if (!request.drizzle) {
    reply.code(400).send({
      error: 'Informe o slug da loja.',
      code: 'TENANT_SLUG_REQUIRED',
    });
    return;
  }

  const result = await login(request.drizzle, parsed.data, request.ip);
  if (!result.ok) {
    reply.code(401).send({ error: 'Email ou senha incorretos.', code: 'UNAUTHORIZED' });
    return;
  }

  await populateFullSession(
    request,
    result.usuario,
    request.tenantSlug!,
    request.tenantId!,
  );

  const { tenant } = await getTenant(request.tenantSlug!);
  reply.send({
    data: {
      step: 'ready',
      tenant: { slug: tenant.slug, lojaNome: tenant.nome },
      user: userPayload(result.usuario),
    },
  });
}

export async function selectTenantHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const parsed = selectTenantSchema.safeParse(request.body);
  if (!parsed.success) {
    reply.code(400).send({
      error: 'Dados inválidos.',
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const email = request.session.email!;
  const resolved = await resolveAdminInTenant(email, parsed.data.tenantSlug);
  if (!resolved.ok) {
    reply.code(403).send({
      error: 'Você não tem acesso a esta loja.',
      code: 'FORBIDDEN',
    });
    return;
  }

  await populateFullSession(
    request,
    resolved.usuario,
    parsed.data.tenantSlug,
    resolved.tenantId,
  );

  reply.send({
    data: {
      tenant: { slug: parsed.data.tenantSlug, lojaNome: resolved.lojaNome },
    },
  });
}

export async function myStoresHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const stores = await findAdminTenantsWithEmail(request.session.email!);
  reply.send({
    data: {
      stores: stores.map((s) => ({ slug: s.slug, lojaNome: s.nome })),
    },
  });
}

export async function clearTenantHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  request.session.tenantSlug = undefined;
  request.session.tenant_id = undefined;
  request.session.usuarioId = null;
  await request.session.save();
  reply.send({ data: { ok: true } });
}

export async function registerHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const parsed = registerSchema.safeParse(request.body);
  if (!parsed.success) {
    reply.code(400).send({
      error: 'Dados inválidos.',
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const result = await register(request.drizzle, parsed.data);
  if (!result.ok) {
    const message =
      result.code === 'EMAIL_EXISTS' ? 'Este email já está cadastrado.' : 'Dados inválidos.';
    reply.code(400).send({ error: message, code: result.code });
    return;
  }

  reply.code(201).send({ data: result.usuario });
}

export async function recoverPasswordHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const parsed = recoverPasswordSchema.safeParse(request.body);
  if (!parsed.success) {
    reply.code(400).send({
      error: 'Dados inválidos.',
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  await recoverPassword(request.drizzle, parsed.data);
  reply.send({
    data: {
      message:
        'Se o email estiver cadastrado, você receberá um link de redefinição em instantes.',
    },
  });
}

export async function validateResetTokenHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const token = (request.params as { token: string }).token;
  const valid = await isResetTokenValid(request.drizzle, token);
  if (!valid) {
    reply.code(404).send({ error: 'Link inválido ou expirado.', code: 'INVALID_TOKEN' });
    return;
  }
  reply.send({ data: { valid: true } });
}

export async function resetPasswordHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const token = (request.params as { token: string }).token;
  const parsed = resetPasswordSchema.safeParse(request.body);
  if (!parsed.success) {
    reply.code(400).send({
      error: 'Dados inválidos.',
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const result = await resetPassword(request.drizzle, token, parsed.data);
  if (!result.ok) {
    reply.code(404).send({ error: 'Link inválido ou expirado.', code: 'INVALID_TOKEN' });
    return;
  }

  reply.send({ data: { ok: true } });
}

export async function logoutHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  await request.session.destroy();
  reply.send({ data: { ok: true } });
}

export async function meHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const hasSession =
    request.session.usuarioId || (request.session.email && request.session.role === 'admin');
  if (!hasSession) {
    reply.code(401).send({ error: 'Não autenticado.', code: 'UNAUTHORIZED' });
    return;
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

  reply.send({
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
}
