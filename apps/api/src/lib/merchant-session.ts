import type { FastifyRequest } from 'fastify';

import type { MemberAuthenticated } from '../modules/auth/auth.service.js';
import {
  applyMerchantPersona,
  applyPreservedStashes,
  preservedStashes,
} from './session-persona.js';

/**
 * Popula a sessão para uma conta merchant autenticada (`merchant_members`).
 * Preserva persona comprador em `stashedBuyer` quando aplicável.
 */
export async function populateMerchantSession(
  request: FastifyRequest,
  member: Pick<MemberAuthenticated, 'id' | 'merchantId' | 'merchantSlug' | 'name' | 'email' | 'role'>,
  store?: { id: number; slug: string },
): Promise<void> {
  const preserved = preservedStashes(request.session);
  await request.session.regenerate();
  applyPreservedStashes(request.session, preserved);
  applyMerchantPersona(
    request.session,
    {
      memberId: member.id,
      merchantId: member.merchantId,
      merchantSlug: member.merchantSlug,
      nome: member.name,
      email: member.email,
      role: member.role as 'owner' | 'admin' | 'operator',
    },
    store,
  );
  await request.session.save();
}
