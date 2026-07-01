import {
  fetchActiveBillingConfig,
  fetchAllInvoices,
  fetchBillingReportRows,
  fetchInvoiceById,
  fetchInvoiceCommissions,
  fetchInvoices,
  fetchMyBilling,
  fetchPlanBySlug,
  fetchPlans,
  fetchRevenueReportRows,
  fetchTenantBillings,
  insertCommissionTransaction,
  upsertTenantBilling,
} from './billing.repository.js';
import type { CommissionTransaction } from './billing.schema.js';

export type { CommissionTransaction } from './billing.schema.js';

/** Porta `BillingService.recordCommissionOnOrder` — usa banco master. */
export async function recordCommissionOnOrder(
  tenantId: number,
  pedidoId: number,
  orderTotal: number,
): Promise<CommissionTransaction | null> {
  const billing = await fetchActiveBillingConfig(tenantId);

  if (billing.rows.length === 0) return null;

  const config = billing.rows[0]!;
  const pct = parseFloat(String(config.commission_percentage ?? 0));
  if (!pct || pct === 0) return null;

  const commissionAmount = (orderTotal * pct) / 100;
  const monthYear = new Date().toISOString().slice(0, 7);

  return insertCommissionTransaction(tenantId, pedidoId, orderTotal, pct, commissionAmount, monthYear);
}

export async function getBillingReport(tenantId: number, monthYear?: string | null) {
  const my = monthYear ?? new Date().toISOString().slice(0, 7);
  const result = await fetchBillingReportRows(tenantId, my);

  if (result.rows.length === 0) return { error: 'Sem dados de faturamento' };

  const data = result.rows[0] as Record<string, unknown>;
  return {
    month: my,
    billingType: data.billing_type,
    monthlyFee: data.monthly_fee,
    commissionPercentage: data.commission_percentage,
    orders: {
      total: parseInt(String(data.total_orders), 10),
      totalSales: parseFloat(String(data.total_sales)),
      totalCommission: parseFloat(String(data.total_commission)),
    },
    invoice: {
      number: data.invoice_number,
      total: parseFloat(String(data.invoice_total ?? 0)),
      status: data.invoice_status,
    },
  };
}

export async function listInvoices(tenantId: number, limit = 12) {
  const result = await fetchInvoices(tenantId, limit);
  return result.rows;
}

export async function getInvoice(tenantId: number, invoiceId: string) {
  const result = await fetchInvoiceById(tenantId, invoiceId);
  if (result.rows.length === 0) return null;

  const invoice = result.rows[0] as Record<string, unknown>;
  if (invoice.billing_type === 'revenue_share' || invoice.billing_type === 'hybrid') {
    const commissions = await fetchInvoiceCommissions(invoiceId);
    invoice.commissions = commissions.rows;
  }
  return invoice;
}

export async function getMyBilling(tenantId: number) {
  const result = await fetchMyBilling(tenantId);
  return result.rows[0] ?? null;
}

export async function listPlans() {
  const result = await fetchPlans();
  return result.rows;
}

export async function assignPlanToTenant(tenantId: number, planSlug: string) {
  const plan = await fetchPlanBySlug(planSlug);
  if (plan.rows.length === 0) throw new Error('Plano não encontrado');

  const planData = plan.rows[0] as Record<string, unknown>;
  const result = await upsertTenantBilling(tenantId, planData);
  return result.rows[0];
}

export async function getRevenueReport(monthYear?: string | null) {
  const my = monthYear ?? new Date().toISOString().slice(0, 7);
  const result = await fetchRevenueReportRows(my);
  const data = result.rows[0] as Record<string, unknown>;
  return {
    month: my,
    activeTenants: parseInt(String(data.active_billing_tenants ?? 0), 10),
    revenue: {
      fixed: parseFloat(String(data.fixed_revenue ?? 0)),
      commission: parseFloat(String(data.commission_revenue ?? 0)),
      hybrid: parseFloat(String(data.hybrid_revenue ?? 0)),
      total: parseFloat(String(data.total_revenue ?? 0)),
    },
    invoices: {
      paid: parseInt(String(data.paid_invoices ?? 0), 10),
      pending: parseInt(String(data.pending_invoices ?? 0), 10),
    },
  };
}

export async function listAllInvoices(opts: {
  monthYear?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;
  const result = await fetchAllInvoices({ ...opts, limit, offset });
  return result.rows;
}

export async function listTenantBillings() {
  const result = await fetchTenantBillings();
  return result.rows;
}
