import type { FastifyInstance } from 'fastify';

import { requireAdmin, requireMerchantMember } from '../../plugins/auth-guard.js';
import {
  assignPlan,
  getBillingConfig,
  getBillingInvoice,
  getBillingInvoices,
  getBillingReport,
  getRevenueReport,
  listBillings,
} from './merchant-billing.controller.js';

export async function merchantBillingRouter(app: FastifyInstance): Promise<void> {
  app.get('/merchants/billing/config', { preHandler: requireMerchantMember }, getBillingConfig);
  app.get('/merchants/billing/report', { preHandler: requireMerchantMember }, getBillingReport);
  app.get('/merchants/billing/invoices', { preHandler: requireMerchantMember }, getBillingInvoices);
  app.get('/merchants/billing/invoices/:id', { preHandler: requireMerchantMember }, getBillingInvoice);

  app.post(
    '/admin/billing/merchants/:merchantId/assign-plan',
    { preHandler: requireAdmin },
    assignPlan,
  );
  app.get('/admin/billing/merchants', { preHandler: requireAdmin }, listBillings);
  app.get('/admin/billing/merchant-revenue-report', { preHandler: requireAdmin }, getRevenueReport);
}
