import type { FastifyRequest } from 'fastify';

import type { Session, SessionFields } from '../plugins/session.js';

export const AUTH_CONTEXT_HEADER = 'x-auth-context';

export type AuthContext = 'buyer' | 'merchant' | 'platform';

export interface StashedMerchantPersona {
  memberId: number;
  merchantId: number;
  merchantSlug: string;
  storeId?: number;
  storeSlug?: string;
  nome: string;
  email: string;
  role: 'owner' | 'admin' | 'operator';
}

export interface StashedBuyerPersona {
  usuarioId: number;
  merchantId: number;
  merchantSlug: string;
  storeId: number;
  storeSlug: string;
  nome: string;
  email: string;
}

export interface StashedPlatformPersona {
  usuarioId: number;
  nome: string;
  email: string;
}

export interface ImpersonationMeta {
  storeSlug: string;
  memberId: number;
  operatorEmail: string;
}

export const MERCHANT_MEMBER_ROLES = ['owner', 'admin', 'operator'] as const;

export function isMerchantMemberRole(role: string | null | undefined): role is (typeof MERCHANT_MEMBER_ROLES)[number] {
  return !!role && (MERCHANT_MEMBER_ROLES as readonly string[]).includes(role);
}

export function resolveAuthContext(request: FastifyRequest): AuthContext | null {
  const raw = request.headers[AUTH_CONTEXT_HEADER];
  if (typeof raw !== 'string') return null;
  const value = raw.trim().toLowerCase();
  if (value === 'buyer' || value === 'merchant' || value === 'platform') return value;
  return null;
}

function captureMerchant(session: Session): StashedMerchantPersona {
  return {
    memberId: session.memberId!,
    merchantId: session.merchantId!,
    merchantSlug: session.merchantSlug!,
    storeId: session.storeId,
    storeSlug: session.storeSlug,
    nome: session.nome ?? '',
    email: session.email ?? '',
    role: session.role as StashedMerchantPersona['role'],
  };
}

function captureBuyer(session: Session): StashedBuyerPersona {
  return {
    usuarioId: session.usuarioId!,
    merchantId: session.merchantId!,
    merchantSlug: session.merchantSlug!,
    storeId: session.storeId!,
    storeSlug: session.storeSlug!,
    nome: session.nome ?? '',
    email: session.email ?? '',
  };
}

function capturePlatform(session: Session): StashedPlatformPersona {
  return {
    usuarioId: session.usuarioId!,
    nome: session.nome ?? '',
    email: session.email ?? '',
  };
}

function clearActiveIdentity(session: Session): void {
  session.usuarioId = undefined;
  session.memberId = undefined;
  session.merchantId = undefined;
  session.merchantSlug = undefined;
  session.storeId = undefined;
  session.storeSlug = undefined;
  session.nome = undefined;
  session.email = undefined;
  session.role = undefined;
}

/** Preserva stashes ao trocar persona ativa (login/regenerate). */
export function preservedStashes(session: Session): {
  stashedMerchant?: StashedMerchantPersona;
  stashedBuyer?: StashedBuyerPersona;
  stashedPlatform?: StashedPlatformPersona;
  impersonation?: ImpersonationMeta;
} {
  const stashedMerchant = session.memberId ? captureMerchant(session) : session.stashedMerchant;
  const stashedBuyer =
    session.usuarioId && session.role === 'usuario' ? captureBuyer(session) : session.stashedBuyer;
  const stashedPlatform =
    session.role === 'platform_admin' && session.usuarioId != null
      ? capturePlatform(session)
      : session.stashedPlatform;

  return {
    ...(stashedMerchant ? { stashedMerchant } : {}),
    ...(stashedBuyer ? { stashedBuyer } : {}),
    ...(stashedPlatform ? { stashedPlatform } : {}),
    ...(session.impersonation ? { impersonation: session.impersonation } : {}),
  };
}

export function applyPreservedStashes(session: Session, preserved: ReturnType<typeof preservedStashes>): void {
  session.stashedMerchant = preserved.stashedMerchant;
  session.stashedBuyer = preserved.stashedBuyer;
  session.stashedPlatform = preserved.stashedPlatform;
  session.impersonation = preserved.impersonation;
}

export function applyMerchantPersona(
  session: Session,
  member: Pick<StashedMerchantPersona, 'memberId' | 'merchantId' | 'merchantSlug' | 'nome' | 'email' | 'role'>,
  store?: { id: number; slug: string },
): void {
  clearActiveIdentity(session);
  session.usuarioId = null;
  session.memberId = member.memberId;
  session.merchantId = member.merchantId;
  session.merchantSlug = member.merchantSlug;
  session.storeId = store?.id;
  session.storeSlug = store?.slug;
  session.nome = member.nome;
  session.email = member.email;
  session.role = member.role;
}

export function applyBuyerPersona(
  session: Session,
  buyer: { id: number; nome: string; email: string },
  ctx: { merchantId: number; merchantSlug: string; storeId: number; storeSlug: string },
): void {
  clearActiveIdentity(session);
  session.usuarioId = buyer.id;
  session.memberId = undefined;
  session.merchantId = ctx.merchantId;
  session.merchantSlug = ctx.merchantSlug;
  session.storeId = ctx.storeId;
  session.storeSlug = ctx.storeSlug;
  session.nome = buyer.nome;
  session.email = buyer.email;
  session.role = 'usuario';
}

export function applyPlatformPersona(session: Session, platform: StashedPlatformPersona): void {
  clearActiveIdentity(session);
  session.usuarioId = platform.usuarioId;
  session.nome = platform.nome;
  session.email = platform.email;
  session.role = 'platform_admin';
}

interface PersonaSnapshot {
  fields: SessionFields;
  stashedMerchant?: StashedMerchantPersona;
  stashedBuyer?: StashedBuyerPersona;
  stashedPlatform?: StashedPlatformPersona;
  impersonation?: ImpersonationMeta;
}

function snapshotSession(session: Session): PersonaSnapshot {
  return {
    fields: {
      usuarioId: session.usuarioId,
      memberId: session.memberId,
      merchantId: session.merchantId,
      merchantSlug: session.merchantSlug,
      storeId: session.storeId,
      storeSlug: session.storeSlug,
      nome: session.nome,
      email: session.email,
      role: session.role,
    },
    stashedMerchant: session.stashedMerchant,
    stashedBuyer: session.stashedBuyer,
    stashedPlatform: session.stashedPlatform,
    impersonation: session.impersonation,
  };
}

function restoreSnapshot(session: Session, snap: PersonaSnapshot): void {
  const target = session as Session & SessionFields;
  for (const [key, value] of Object.entries(snap.fields)) {
    (target as unknown as Record<string, unknown>)[key] = value;
  }
  session.stashedMerchant = snap.stashedMerchant;
  session.stashedBuyer = snap.stashedBuyer;
  session.stashedPlatform = snap.stashedPlatform;
  session.impersonation = snap.impersonation;
}

/** Ativa persona pedida via header só em memória (não persiste no cookie). */
export function activatePersonaForRequest(session: Session, context: AuthContext): (() => void) | null {
  if (context === 'merchant') {
    if (session.memberId) return null;
    if (!session.stashedMerchant) return null;
    const snap = snapshotSession(session);
    applyMerchantPersona(session, session.stashedMerchant, optionalStore(session.stashedMerchant));
    return () => restoreSnapshot(session, snap);
  }

  if (context === 'buyer') {
    if (session.usuarioId && session.role === 'usuario') return null;
    if (!session.stashedBuyer) return null;
    const snap = snapshotSession(session);
    applyBuyerPersona(
      session,
      {
        id: session.stashedBuyer.usuarioId,
        nome: session.stashedBuyer.nome,
        email: session.stashedBuyer.email,
      },
      session.stashedBuyer,
    );
    return () => restoreSnapshot(session, snap);
  }

  if (context === 'platform') {
    if (session.role === 'platform_admin' && session.usuarioId != null) return null;
    if (!session.stashedPlatform) return null;
    const snap = snapshotSession(session);
    applyPlatformPersona(session, session.stashedPlatform);
    return () => restoreSnapshot(session, snap);
  }

  return null;
}

function optionalStore(merchant: StashedMerchantPersona): { id: number; slug: string } | undefined {
  if (merchant.storeId && merchant.storeSlug) {
    return { id: merchant.storeId, slug: merchant.storeSlug };
  }
  return undefined;
}

export function merchantPersonaFromSession(session: Session): StashedMerchantPersona | null {
  if (session.memberId) return captureMerchant(session);
  return session.stashedMerchant ?? null;
}

export function buyerPersonaFromSession(session: Session): StashedBuyerPersona | null {
  if (session.usuarioId && session.role === 'usuario') {
    return captureBuyer(session);
  }
  return session.stashedBuyer ?? null;
}

export function platformPersonaFromSession(session: Session): StashedPlatformPersona | null {
  if (session.role === 'platform_admin' && session.usuarioId != null) {
    return capturePlatform(session);
  }
  return session.stashedPlatform ?? null;
}

/** Logout parcial — remove só a persona pedida e restaura a stashed oposta, se existir. */
export function logoutPersona(session: Session, context: AuthContext): boolean {
  if (context === 'buyer') {
    if (!(session.usuarioId && session.role === 'usuario')) return false;
    session.stashedBuyer = undefined;
    clearActiveIdentity(session);
    if (session.stashedMerchant) {
      applyMerchantPersona(session, session.stashedMerchant, optionalStore(session.stashedMerchant));
      session.stashedMerchant = undefined;
      return true;
    }
    if (session.stashedPlatform) {
      applyPlatformPersona(session, session.stashedPlatform);
      session.stashedPlatform = undefined;
      return true;
    }
    return true;
  }

  if (context === 'merchant') {
    if (!session.memberId) return false;
    session.stashedMerchant = undefined;
    session.impersonation = undefined;
    clearActiveIdentity(session);
    if (session.stashedBuyer) {
      applyBuyerPersona(
        session,
        {
          id: session.stashedBuyer.usuarioId,
          nome: session.stashedBuyer.nome,
          email: session.stashedBuyer.email,
        },
        session.stashedBuyer,
      );
      session.stashedBuyer = undefined;
      return true;
    }
    if (session.stashedPlatform) {
      applyPlatformPersona(session, session.stashedPlatform);
      session.stashedPlatform = undefined;
      return true;
    }
    return true;
  }

  if (context === 'platform') {
    if (!(session.role === 'platform_admin' && session.usuarioId != null)) return false;
    session.stashedPlatform = undefined;
    clearActiveIdentity(session);
    if (session.stashedMerchant) {
      applyMerchantPersona(session, session.stashedMerchant, optionalStore(session.stashedMerchant));
      session.stashedMerchant = undefined;
      return true;
    }
    return true;
  }

  return false;
}
