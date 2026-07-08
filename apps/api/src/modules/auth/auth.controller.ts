import type { FastifyReply, FastifyRequest } from 'fastify';

import {
  findActiveStoreInMerchant,
  listActiveStoresForMerchant,
} from '../../lib/resolve-member-login.js';
import {
  getStoreBySlug,
  StoreNotFoundError,
  type StoreContext,
} from '../../lib/merchant-db.js';
import { populateMerchantSession } from '../../lib/merchant-session.js';
import {
  applyBuyerPersona,
  applyPreservedStashes,
  logoutPersona,
  preservedStashes,
  resolveAuthContext,
} from '../../lib/session-persona.js';
import { requireStoreScope } from '../../lib/store-scope.js';
import { resolveStoreSlug } from '../../plugins/store.js';
import {
  loginSchema,
  recoverPasswordSchema,
  registerSchema,
  resetPasswordSchema,
  selectStoreSchema,
} from './auth.schemas.js';
import {
  isResetTokenValid,
  loginBuyer,
  loginMerchantAccount,
  recoverPassword,
  register,
  resetPassword,
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

async function populateBuyerSession(
  request: FastifyRequest,
  buyer: { id: number; nome: string; email: string },
  ctx: StoreContext,
): Promise<void> {
  const preserved = preservedStashes(request.session);
  await request.session.regenerate();
  applyPreservedStashes(request.session, preserved);
  applyBuyerPersona(request.session, buyer, {
    merchantId: ctx.merchant.id,
    merchantSlug: ctx.merchant.slug,
    storeId: ctx.store.id,
    storeSlug: ctx.store.slug,
  });
  await request.session.save();
}

async function tryMerchantLoginForStore(
  request: FastifyRequest,
  reply: FastifyReply,
  ctx: StoreContext,
  credentials: { email: string; senha: string },
): Promise<boolean> {
  const accountResult = await loginMerchantAccount(credentials, request.ip);
  if (!accountResult.ok) {
    if (accountResult.code === 'IP_BLOCKED' || accountResult.code === 'ACCOUNT_LOCKED') {
      await reply.code(401).send({
        error: 'Conta temporariamente bloqueada. Tente novamente mais tarde.',
        code: accountResult.code,
      });
      return true;
    }
    return false;
  }

  const targetStore =
    accountResult.step === 'ready'
      ? accountResult.store
      : accountResult.stores.find((s) => s.slug === ctx.store.slug);

  if (!targetStore || targetStore.slug !== ctx.store.slug) {
    return false;
  }

  await populateMerchantSession(request, accountResult.member, {
    id: targetStore.id,
    slug: targetStore.slug,
  });

  await reply.send({
    data: {
      step: 'ready',
      redirectToAdmin: true,
      merchant: {
        slug: accountResult.member.merchantSlug,
        nome: accountResult.member.merchantName,
      },
      store: { slug: targetStore.slug, nome: targetStore.nome },
      user: userPayload({
        nome: accountResult.member.name,
        email: accountResult.member.email,
        role: accountResult.member.role,
      }),
    },
  });
  return true;
}

export async function postLogin(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const parsed = loginSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({
      error: 'Dados inválidos.',
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const storeSlug = parsed.data.storeSlug?.trim() || resolveStoreSlug(request);

  if (storeSlug) {
    try {
      const ctx = await getStoreBySlug(storeSlug);
      const result = await loginBuyer(
        { merchantDb: ctx.merchantDb, storeId: ctx.store.id },
        parsed.data,
        request.ip,
      );

      if (!result.ok) {
        if (result.code === 'IP_BLOCKED' || result.code === 'ACCOUNT_LOCKED') {
          return reply.code(401).send({
            error: 'Conta temporariamente bloqueada. Tente novamente mais tarde.',
            code: result.code,
          });
        }

        const merchantHandled = await tryMerchantLoginForStore(request, reply, ctx, parsed.data);
        if (merchantHandled) return;
        return reply.code(401).send({ error: 'Email ou senha incorretos.', code: 'UNAUTHORIZED' });
      }

      await populateBuyerSession(request, result.usuario, ctx);
      return reply.send({
        data: {
          step: 'ready',
          store: { slug: ctx.store.slug, nome: ctx.store.name },
          user: userPayload(result.usuario),
        },
      });
    } catch (err) {
      if (err instanceof StoreNotFoundError) {
        return reply.code(404).send({ error: 'Loja não encontrada.', code: 'STORE_NOT_FOUND' });
      }
      throw err;
    }
  }

  const accountResult = await loginMerchantAccount(parsed.data, request.ip);
  if (!accountResult.ok) {
    if (accountResult.code === 'IP_BLOCKED' || accountResult.code === 'ACCOUNT_LOCKED') {
      return reply.code(401).send({
        error: 'Conta temporariamente bloqueada. Tente novamente mais tarde.',
        code: accountResult.code,
      });
    }
    return reply.code(401).send({ error: 'Email ou senha incorretos.', code: 'UNAUTHORIZED' });
  }

  if (accountResult.step === 'ready') {
    await populateMerchantSession(request, accountResult.member, {
      id: accountResult.store.id,
      slug: accountResult.store.slug,
    });
    return reply.send({
      data: {
        step: 'ready',
        merchant: {
          slug: accountResult.member.merchantSlug,
          nome: accountResult.member.merchantName,
        },
        store: accountResult.store,
        user: userPayload({
          nome: accountResult.member.name,
          email: accountResult.member.email,
          role: accountResult.member.role,
        }),
      },
    });
  }

  await populateMerchantSession(request, accountResult.member);
  return reply.send({
    data: {
      step: 'select_store',
      merchant: {
        slug: accountResult.member.merchantSlug,
        nome: accountResult.member.merchantName,
      },
      stores: accountResult.stores,
      user: userPayload({
        nome: accountResult.member.name,
        email: accountResult.member.email,
        role: accountResult.member.role,
      }),
    },
  });
}

export async function getMyStores(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const stores = await listActiveStoresForMerchant(request.session.merchantId!);
  return reply.send({
    data: { stores: stores.map((s) => ({ slug: s.slug, nome: s.name })) },
  });
}

export async function postSelectStore(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const parsed = selectStoreSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({
      error: 'Dados inválidos.',
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const store = await findActiveStoreInMerchant(
    request.session.merchantId!,
    parsed.data.storeSlug,
  );
  if (!store) {
    return reply.code(403).send({
      error: 'Você não tem acesso a esta loja.',
      code: 'FORBIDDEN',
    });
  }

  await populateMerchantSession(
    request,
    {
      id: request.session.memberId!,
      name: request.session.nome ?? '',
      email: request.session.email ?? '',
      role: request.session.role ?? 'owner',
      merchantId: request.session.merchantId!,
      merchantSlug: request.session.merchantSlug ?? '',
    },
    { id: store.id, slug: store.slug },
  );

  return reply.send({
    data: { store: { slug: store.slug, nome: store.name } },
  });
}

export async function postClearStore(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  request.session.storeId = undefined;
  request.session.storeSlug = undefined;
  await request.session.save();
  return reply.send({ data: { ok: true } });
}

export async function postRegister(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const parsed = registerSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({
      error: 'Dados inválidos.',
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const scope = requireStoreScope(request);
  const result = await register(scope, parsed.data);
  if (!result.ok) {
    const message =
      result.code === 'EMAIL_EXISTS' ? 'Este email já está cadastrado.' : 'Dados inválidos.';
    return reply.code(400).send({ error: message, code: result.code });
  }

  return reply.code(201).send({ data: result.usuario });
}

export async function postRecoverPassword(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const parsed = recoverPasswordSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({
      error: 'Dados inválidos.',
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  await recoverPassword(requireStoreScope(request), parsed.data);
  return reply.send({
    data: {
      message:
        'Se o email estiver cadastrado, você receberá um link de redefinição em instantes.',
    },
  });
}

export async function getResetPasswordToken(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const token = (request.params as { token: string }).token;
  const valid = await isResetTokenValid(requireStoreScope(request), token);
  if (!valid) {
    return reply.code(404).send({ error: 'Link inválido ou expirado.', code: 'INVALID_TOKEN' });
  }
  return reply.send({ data: { valid: true } });
}

export async function postResetPassword(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const token = (request.params as { token: string }).token;
  const parsed = resetPasswordSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({
      error: 'Dados inválidos.',
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const result = await resetPassword(requireStoreScope(request), token, parsed.data);
  if (!result.ok) {
    return reply.code(404).send({ error: 'Link inválido ou expirado.', code: 'INVALID_TOKEN' });
  }

  return reply.send({ data: { ok: true } });
}

export async function postLogout(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const context = resolveAuthContext(request);
  if (context) {
    logoutPersona(request.session, context);
    const hasIdentity =
      request.session.memberId != null ||
      (request.session.usuarioId != null && request.session.role === 'usuario') ||
      request.session.role === 'platform_admin';
    if (hasIdentity) {
      await request.session.save();
      return reply.send({ data: { ok: true, partial: true } });
    }
  }

  await request.session.destroy();
  return reply.send({ data: { ok: true } });
}

export async function getMe(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const memberId = request.session.memberId;
  const usuarioId = request.session.usuarioId;

  if (!memberId && !usuarioId) {
    return reply.code(401).send({ error: 'Não autenticado.', code: 'UNAUTHORIZED' });
  }

  if (memberId) {
    const storeSlug = request.session.storeSlug;
    let storeName: string | null = null;
    if (storeSlug) {
      try {
        storeName = (await getStoreBySlug(storeSlug)).store.name;
      } catch {
        storeName = storeSlug;
      }
    }

    return reply.send({
      data: {
        usuario: {
          id: memberId,
          nome: request.session.nome,
          email: request.session.email,
          role: request.session.role,
        },
        merchant: request.session.merchantSlug
          ? { slug: request.session.merchantSlug, nome: request.session.merchantSlug }
          : null,
        store: storeSlug ? { slug: storeSlug, nome: storeName ?? storeSlug } : null,
        tenant: null,
        impersonation: request.session.impersonation
          ? {
              storeSlug: request.session.impersonation.storeSlug,
              operatorEmail: request.session.impersonation.operatorEmail,
            }
          : null,
      },
    });
  }

  return reply.send({
    data: {
      usuario: {
        id: usuarioId,
        nome: request.session.nome,
        email: request.session.email,
        role: request.session.role,
      },
      merchant: null,
      store: request.session.storeSlug
        ? { slug: request.session.storeSlug, nome: request.session.storeSlug }
        : null,
      tenant: null,
      impersonation: null,
    },
  });
}
