import type { FastifyReply, FastifyRequest } from 'fastify';

import {
  assignPlanBodySchema,
  invoicesQuerySchema,
  listAllInvoicesQuerySchema,
  monthYearQuerySchema,
} from './billing.schema.js';
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
} from './billing.service.js';

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL ?? 'ramon.oliveira08@gmail.com';

export function requireSuperAdmin(request: { session?: { email?: string | null } }) {
  return request.session?.email === SUPER_ADMIN_EMAIL;
}

export async function getBillingConfigHandler(request: FastifyRequest, reply: FastifyReply) {
  if (!request.tenantId) {
    return reply.code(404).send({ error: 'Tenant não encontrado.', code: 'NOT_FOUND' });
  }
  const billing = await getMyBilling(request.tenantId);
  if (!billing) {
    return reply.code(404).send({ error: 'Billing não configurado.', code: 'NOT_FOUND' });
  }
  return reply.send({ data: billing });
}

export async function getBillingReportHandler(request: FastifyRequest, reply: FastifyReply) {
  if (!request.tenantId) {
    return reply.code(404).send({ error: 'Tenant não encontrado.', code: 'NOT_FOUND' });
  }
  const parsed = monthYearQuerySchema.safeParse(request.query);
  const report = await getBillingReport(request.tenantId, parsed.success ? parsed.data.monthYear : undefined);
  return reply.send({ data: report });
}

export async function listInvoicesHandler(request: FastifyRequest, reply: FastifyReply) {
  if (!request.tenantId) {
    return reply.code(404).send({ error: 'Tenant não encontrado.', code: 'NOT_FOUND' });
  }
  const parsed = invoicesQuerySchema.safeParse(request.query);
  const limit = parsed.success ? parsed.data.limit : 12;
  const invoices = await listInvoices(request.tenantId, limit);
  return reply.send({ data: invoices });
}

export async function getInvoiceHandler(request: FastifyRequest, reply: FastifyReply) {
  if (!request.tenantId) {
    return reply.code(404).send({ error: 'Tenant não encontrado.', code: 'NOT_FOUND' });
  }
  const invoiceId = (request.params as { id: string }).id;
  const invoice = await getInvoice(request.tenantId, invoiceId);
  if (!invoice) {
    return reply.code(404).send({ error: 'Invoice não encontrada.', code: 'NOT_FOUND' });
  }
  return reply.send({ data: invoice });
}

export async function listPlansHandler(_request: FastifyRequest, reply: FastifyReply) {
  const plans = await listPlans();
  return reply.send({ data: plans });
}

export async function assignPlanHandler(request: FastifyRequest, reply: FastifyReply) {
  if (!requireSuperAdmin(request)) {
    return reply.code(403).send({ error: 'Não autorizado.', code: 'FORBIDDEN' });
  }
  const tenantId = parseInt((request.params as { tenantId: string }).tenantId, 10);
  const parsed = assignPlanBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'planSlug é obrigatório.', code: 'VALIDATION_ERROR' });
  }
  try {
    const billing = await assignPlanToTenant(tenantId, parsed.data.planSlug);
    return reply.send({ data: billing });
  } catch (err) {
    return reply.code(500).send({
      error: err instanceof Error ? err.message : 'Erro ao atribuir plano.',
      code: 'BILLING_ERROR',
    });
  }
}

export async function getRevenueReportHandler(request: FastifyRequest, reply: FastifyReply) {
  if (!requireSuperAdmin(request)) {
    return reply.code(403).send({ error: 'Não autorizado.', code: 'FORBIDDEN' });
  }
  const parsed = monthYearQuerySchema.safeParse(request.query);
  const report = await getRevenueReport(parsed.success ? parsed.data.monthYear : undefined);
  return reply.send({ data: report });
}

export async function listAllInvoicesHandler(request: FastifyRequest, reply: FastifyReply) {
  if (!requireSuperAdmin(request)) {
    return reply.code(403).send({ error: 'Não autorizado.', code: 'FORBIDDEN' });
  }
  const parsed = listAllInvoicesQuerySchema.safeParse(request.query);
  const q = parsed.success ? parsed.data : { limit: 50, offset: 0 };
  const invoices = await listAllInvoices({
    monthYear: q.monthYear,
    status: q.status,
    limit: q.limit,
    offset: q.offset,
  });
  return reply.send({ data: invoices });
}

export async function listTenantBillingsHandler(request: FastifyRequest, reply: FastifyReply) {
  if (!requireSuperAdmin(request)) {
    return reply.code(403).send({ error: 'Não autorizado.', code: 'FORBIDDEN' });
  }
  const billings = await listTenantBillings();
  return reply.send({ data: billings });
}
