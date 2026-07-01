import type { FastifyInstance } from 'fastify';

import { requireAdmin, requireAuth } from '../../plugins/auth-guard.js';
import {
  assignPlanHandler,
  getBillingConfigHandler,
  getBillingReportHandler,
  getInvoiceHandler,
  getRevenueReportHandler,
  listAllInvoicesHandler,
  listInvoicesHandler,
  listPlansHandler,
  listTenantBillingsHandler,
} from './billing.controller.js';

export async function billingRoutes(app: FastifyInstance): Promise<void> {
  app.get('/billing/config', { preHandler: requireAuth }, getBillingConfigHandler);
  app.get('/billing/report', { preHandler: requireAuth }, getBillingReportHandler);
  app.get('/billing/invoices', { preHandler: requireAuth }, listInvoicesHandler);
  app.get('/billing/invoices/:id', { preHandler: requireAuth }, getInvoiceHandler);

  app.get('/admin/billing/plans', { preHandler: requireAdmin }, listPlansHandler);
  app.post('/admin/billing/tenants/:tenantId/assign-plan', { preHandler: requireAdmin }, assignPlanHandler);
  app.get('/admin/billing/revenue-report', { preHandler: requireAdmin }, getRevenueReportHandler);
  app.get('/admin/billing/invoices', { preHandler: requireAdmin }, listAllInvoicesHandler);
  app.get('/admin/billing/tenants', { preHandler: requireAdmin }, listTenantBillingsHandler);
}
