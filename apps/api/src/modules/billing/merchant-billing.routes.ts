import { assignMerchantPlanSchema } from '@lojao/types/merchant';
import type { FastifyInstance } from 'fastify';

import { requireAdmin, requireMerchantMember } from '../../plugins/auth-guard.js';
import {
  assignPlanToMerchant,
  getMerchantBilling,
  getMerchantBillingReport,
  getMerchantInvoice,
  getMerchantRevenueReport,
  listMerchantBillings,
  listMerchantInvoices,
} from '../../services/merchant-billing.service.js';

function requireSuperAdmin(request: { session?: { email?: string | null } }) {
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL ?? 'ramon.oliveira08@gmail.com';
  return request.session?.email === superAdminEmail;
}

/**
 * MA7 — billing por conta merchant.
 * Rotas autenticadas usam `session.merchantId` (modelo MA5+); rotas tenant
 * legado permanecem inalteradas até o cutover MA8.
 */
export async function merchantBillingRoutes(app: FastifyInstance): Promise<void> {
  app.get('/merchants/billing/config', { preHandler: requireMerchantMember }, async (request, reply) => {
    const merchantId = request.session.merchantId;
    if (!merchantId) {
      return reply.code(401).send({ error: 'Não autenticado.', code: 'UNAUTHORIZED' });
    }
    const billing = await getMerchantBilling(merchantId);
    if (!billing) {
      return reply.code(404).send({ error: 'Billing não configurado.', code: 'NOT_FOUND' });
    }
    return reply.send({ data: billing });
  });

  app.get('/merchants/billing/report', { preHandler: requireMerchantMember }, async (request, reply) => {
    const merchantId = request.session.merchantId;
    if (!merchantId) {
      return reply.code(401).send({ error: 'Não autenticado.', code: 'UNAUTHORIZED' });
    }
    const monthYear = (request.query as { monthYear?: string }).monthYear;
    const report = await getMerchantBillingReport(merchantId, monthYear);
    return reply.send({ data: report });
  });

  app.get('/merchants/billing/invoices', { preHandler: requireMerchantMember }, async (request, reply) => {
    const merchantId = request.session.merchantId;
    if (!merchantId) {
      return reply.code(401).send({ error: 'Não autenticado.', code: 'UNAUTHORIZED' });
    }
    const limit = parseInt(String((request.query as { limit?: string }).limit ?? '12'), 10);
    const invoices = await listMerchantInvoices(merchantId, limit);
    return reply.send({ data: invoices });
  });

  app.get('/merchants/billing/invoices/:id', { preHandler: requireMerchantMember }, async (request, reply) => {
    const merchantId = request.session.merchantId;
    if (!merchantId) {
      return reply.code(401).send({ error: 'Não autenticado.', code: 'UNAUTHORIZED' });
    }
    const invoiceId = (request.params as { id: string }).id;
    const invoice = await getMerchantInvoice(merchantId, invoiceId);
    if (!invoice) {
      return reply.code(404).send({ error: 'Invoice não encontrada.', code: 'NOT_FOUND' });
    }
    return reply.send({ data: invoice });
  });

  // Super admin — contas merchant
  app.post(
    '/admin/billing/merchants/:merchantId/assign-plan',
    { preHandler: requireAdmin },
    async (request, reply) => {
      if (!requireSuperAdmin(request)) {
        return reply.code(403).send({ error: 'Não autorizado.', code: 'FORBIDDEN' });
      }
      const merchantId = parseInt((request.params as { merchantId: string }).merchantId, 10);
      const parsed = assignMerchantPlanSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: 'Dados inválidos.',
          code: 'VALIDATION_ERROR',
          details: parsed.error.flatten().fieldErrors,
        });
      }
      if (parsed.data.planSlug === 'enterprise' && parsed.data.customMaxStores == null) {
        return reply.code(400).send({
          error: 'Plano Enterprise exige customMaxStores.',
          code: 'VALIDATION_ERROR',
        });
      }
      try {
        const billing = await assignPlanToMerchant(merchantId, parsed.data.planSlug, {
          customMaxStores: parsed.data.customMaxStores,
        });
        return reply.send({ data: billing });
      } catch (err) {
        return reply.code(500).send({
          error: err instanceof Error ? err.message : 'Erro ao atribuir plano.',
          code: 'BILLING_ERROR',
        });
      }
    },
  );

  app.get('/admin/billing/merchants', { preHandler: requireAdmin }, async (request, reply) => {
    if (!requireSuperAdmin(request)) {
      return reply.code(403).send({ error: 'Não autorizado.', code: 'FORBIDDEN' });
    }
    const billings = await listMerchantBillings();
    return reply.send({ data: billings });
  });

  app.get('/admin/billing/merchant-revenue-report', { preHandler: requireAdmin }, async (request, reply) => {
    if (!requireSuperAdmin(request)) {
      return reply.code(403).send({ error: 'Não autorizado.', code: 'FORBIDDEN' });
    }
    const monthYear = (request.query as { monthYear?: string }).monthYear;
    const report = await getMerchantRevenueReport(monthYear);
    return reply.send({ data: report });
  });
}
