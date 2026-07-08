import { assignMerchantPlanSchema } from '@lojao/types/merchant';
import type { FastifyReply, FastifyRequest } from 'fastify';

import {
  assignPlanToMerchant,
  getMerchantBilling,
  getMerchantBillingReport,
  getMerchantInvoice,
  getMerchantRevenueReport,
  listMerchantBillings,
  listMerchantInvoices,
} from '../../services/merchant-billing.service.js';

function isSuperAdmin(request: FastifyRequest): boolean {
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL ?? 'ramon.oliveira08@gmail.com';
  return request.session?.email === superAdminEmail;
}

export async function getBillingConfig(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const merchantId = request.session.merchantId;
  if (!merchantId) {
    return reply.code(401).send({ error: 'Não autenticado.', code: 'UNAUTHORIZED' });
  }
  const billing = await getMerchantBilling(merchantId);
  if (!billing) {
    return reply.code(404).send({ error: 'Billing não configurado.', code: 'NOT_FOUND' });
  }
  return reply.send({ data: billing });
}

export async function getBillingReport(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const merchantId = request.session.merchantId;
  if (!merchantId) {
    return reply.code(401).send({ error: 'Não autenticado.', code: 'UNAUTHORIZED' });
  }
  const monthYear = (request.query as { monthYear?: string }).monthYear;
  const report = await getMerchantBillingReport(merchantId, monthYear);
  return reply.send({ data: report });
}

export async function getBillingInvoices(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const merchantId = request.session.merchantId;
  if (!merchantId) {
    return reply.code(401).send({ error: 'Não autenticado.', code: 'UNAUTHORIZED' });
  }
  const limit = parseInt(String((request.query as { limit?: string }).limit ?? '12'), 10);
  const invoices = await listMerchantInvoices(merchantId, limit);
  return reply.send({ data: invoices });
}

export async function getBillingInvoice(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
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
}

export async function assignPlan(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!isSuperAdmin(request)) {
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
}

export async function listBillings(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!isSuperAdmin(request)) {
    return reply.code(403).send({ error: 'Não autorizado.', code: 'FORBIDDEN' });
  }
  const billings = await listMerchantBillings();
  return reply.send({ data: billings });
}

export async function getRevenueReport(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (!isSuperAdmin(request)) {
    return reply.code(403).send({ error: 'Não autorizado.', code: 'FORBIDDEN' });
  }
  const monthYear = (request.query as { monthYear?: string }).monthYear;
  const report = await getMerchantRevenueReport(monthYear);
  return reply.send({ data: report });
}
