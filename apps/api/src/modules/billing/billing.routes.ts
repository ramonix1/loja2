import type { FastifyInstance } from 'fastify';

import { requireAdmin, requireAuth } from '../../plugins/auth-guard.js';
import {
  assignPlanToTenant,
  getBillingReport,
  getInvoice,
  getMyBilling,
  getRevenueReport,
  listAllInvoices,
  listInvoices,
  listPlans,
  listTenantBillings,
} from '../../services/billing.service.js';

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL ?? 'ramon.oliveira08@gmail.com';

function requireSuperAdmin(request: { session?: { email?: string | null } }) {
  return request.session?.email === SUPER_ADMIN_EMAIL;
}

export async function billingRoutes(app: FastifyInstance): Promise<void> {
  app.get('/billing/config', { preHandler: requireAuth }, async (request, reply) => {
    if (!request.tenantId) {
      return reply.code(404).send({ error: 'Tenant não encontrado.', code: 'NOT_FOUND' });
    }
    const billing = await getMyBilling(request.tenantId);
    if (!billing) {
      return reply.code(404).send({ error: 'Billing não configurado.', code: 'NOT_FOUND' });
    }
    return reply.send({ data: billing });
  });

  app.get('/billing/report', { preHandler: requireAuth }, async (request, reply) => {
    if (!request.tenantId) {
      return reply.code(404).send({ error: 'Tenant não encontrado.', code: 'NOT_FOUND' });
    }
    const monthYear = (request.query as { monthYear?: string }).monthYear;
    const report = await getBillingReport(request.tenantId, monthYear);
    return reply.send({ data: report });
  });

  app.get('/billing/invoices', { preHandler: requireAuth }, async (request, reply) => {
    if (!request.tenantId) {
      return reply.code(404).send({ error: 'Tenant não encontrado.', code: 'NOT_FOUND' });
    }
    const limit = parseInt(String((request.query as { limit?: string }).limit ?? '12'), 10);
    const invoices = await listInvoices(request.tenantId, limit);
    return reply.send({ data: invoices });
  });

  app.get('/billing/invoices/:id', { preHandler: requireAuth }, async (request, reply) => {
    if (!request.tenantId) {
      return reply.code(404).send({ error: 'Tenant não encontrado.', code: 'NOT_FOUND' });
    }
    const invoiceId = (request.params as { id: string }).id;
    const invoice = await getInvoice(request.tenantId, invoiceId);
    if (!invoice) {
      return reply.code(404).send({ error: 'Invoice não encontrada.', code: 'NOT_FOUND' });
    }
    return reply.send({ data: invoice });
  });

  // Super admin
  app.get('/admin/billing/plans', { preHandler: requireAdmin }, async (_request, reply) => {
    const plans = await listPlans();
    return reply.send({ data: plans });
  });

  app.post('/admin/billing/tenants/:tenantId/assign-plan', { preHandler: requireAdmin }, async (request, reply) => {
    if (!requireSuperAdmin(request)) {
      return reply.code(403).send({ error: 'Não autorizado.', code: 'FORBIDDEN' });
    }
    const tenantId = parseInt((request.params as { tenantId: string }).tenantId, 10);
    const { planSlug } = request.body as { planSlug?: string };
    if (!planSlug) {
      return reply.code(400).send({ error: 'planSlug é obrigatório.', code: 'VALIDATION_ERROR' });
    }
    try {
      const billing = await assignPlanToTenant(tenantId, planSlug);
      return reply.send({ data: billing });
    } catch (err) {
      return reply.code(500).send({
        error: err instanceof Error ? err.message : 'Erro ao atribuir plano.',
        code: 'BILLING_ERROR',
      });
    }
  });

  app.get('/admin/billing/revenue-report', { preHandler: requireAdmin }, async (request, reply) => {
    if (!requireSuperAdmin(request)) {
      return reply.code(403).send({ error: 'Não autorizado.', code: 'FORBIDDEN' });
    }
    const monthYear = (request.query as { monthYear?: string }).monthYear;
    const report = await getRevenueReport(monthYear);
    return reply.send({ data: report });
  });

  app.get('/admin/billing/invoices', { preHandler: requireAdmin }, async (request, reply) => {
    if (!requireSuperAdmin(request)) {
      return reply.code(403).send({ error: 'Não autorizado.', code: 'FORBIDDEN' });
    }
    const q = request.query as { monthYear?: string; status?: string; limit?: string; offset?: string };
    const invoices = await listAllInvoices({
      monthYear: q.monthYear,
      status: q.status,
      limit: parseInt(q.limit ?? '50', 10),
      offset: parseInt(q.offset ?? '0', 10),
    });
    return reply.send({ data: invoices });
  });

  app.get('/admin/billing/tenants', { preHandler: requireAdmin }, async (request, reply) => {
    if (!requireSuperAdmin(request)) {
      return reply.code(403).send({ error: 'Não autorizado.', code: 'FORBIDDEN' });
    }
    const billings = await listTenantBillings();
    return reply.send({ data: billings });
  });
}
