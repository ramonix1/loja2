import { masterPool } from '../../lib/master-db.js';

import type { CommissionTransaction } from './billing.schema.js';

export async function fetchActiveBillingConfig(tenantId: number) {
  return masterPool.query<{
    commission_percentage: string | null;
  }>(
    `SELECT tb.*, bp.commission_percentage
     FROM tenant_billing tb
     JOIN billing_plans bp ON tb.plan_id = bp.id
     WHERE tb.tenant_id = $1 AND tb.status = 'active'`,
    [tenantId],
  );
}

export async function insertCommissionTransaction(
  tenantId: number,
  pedidoId: number,
  orderTotal: number,
  pct: number,
  commissionAmount: number,
  monthYear: string,
): Promise<CommissionTransaction | null> {
  const result = await masterPool.query<CommissionTransaction>(
    `INSERT INTO commission_transactions
       (tenant_id, pedido_id, order_total, commission_percentage, commission_amount, month_year, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending')
     RETURNING *`,
    [tenantId, pedidoId, orderTotal, pct, commissionAmount, monthYear],
  );

  return result.rows[0] ?? null;
}

export async function fetchBillingReportRows(tenantId: number, monthYear: string) {
  return masterPool.query(
    `SELECT
       tb.billing_type,
       tb.monthly_fee,
       tb.commission_percentage,
       COUNT(DISTINCT ct.id) as total_orders,
       COALESCE(SUM(ct.order_total), 0) as total_sales,
       COALESCE(SUM(ct.commission_amount), 0) as total_commission,
       i.invoice_number,
       i.total as invoice_total,
       i.status as invoice_status
     FROM tenant_billing tb
     LEFT JOIN commission_transactions ct ON tb.tenant_id = ct.tenant_id AND ct.month_year = $2
     LEFT JOIN invoices i ON tb.tenant_id = i.tenant_id AND i.month_year = $2
     WHERE tb.tenant_id = $1
     GROUP BY tb.id, i.id`,
    [tenantId, monthYear],
  );
}

export async function fetchInvoices(tenantId: number, limit: number) {
  return masterPool.query(
    `SELECT id, invoice_number, month_year, billing_type, monthly_fee, total_sales,
            commission_amount, total, status, issue_date, due_date, paid_at
     FROM invoices
     WHERE tenant_id = $1
     ORDER BY issue_date DESC
     LIMIT $2`,
    [tenantId, limit],
  );
}

export async function fetchInvoiceById(tenantId: number, invoiceId: string) {
  return masterPool.query(`SELECT * FROM invoices WHERE id = $1 AND tenant_id = $2`, [
    invoiceId,
    tenantId,
  ]);
}

export async function fetchInvoiceCommissions(invoiceId: string) {
  return masterPool.query(
    `SELECT pedido_id, order_total, commission_percentage, commission_amount, created_at
     FROM commission_transactions
     WHERE invoice_id = $1
     ORDER BY created_at DESC`,
    [invoiceId],
  );
}

export async function fetchMyBilling(tenantId: number) {
  return masterPool.query(
    `SELECT tb.id, tb.billing_type, tb.monthly_fee, tb.commission_percentage,
            bp.name as plan_name, bp.slug as plan_slug, bp.features,
            tb.status, tb.next_billing_date, tb.created_at
     FROM tenant_billing tb
     JOIN billing_plans bp ON tb.plan_id = bp.id
     WHERE tb.tenant_id = $1`,
    [tenantId],
  );
}

export async function fetchPlans() {
  return masterPool.query(
    `SELECT id, name, slug, description, price, billing_type, commission_percentage, features, created_at
     FROM billing_plans
     ORDER BY price ASC NULLS LAST`,
  );
}

export async function fetchPlanBySlug(planSlug: string) {
  return masterPool.query(`SELECT * FROM billing_plans WHERE slug = $1`, [planSlug]);
}

export async function upsertTenantBilling(
  tenantId: number,
  planData: Record<string, unknown>,
) {
  return masterPool.query(
    `INSERT INTO tenant_billing
       (tenant_id, plan_id, billing_type, monthly_fee, commission_percentage, next_billing_date, status)
     VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '1 month', 'active')
     ON CONFLICT (tenant_id) DO UPDATE SET
       plan_id = $2, billing_type = $3, monthly_fee = $4, commission_percentage = $5, updated_at = NOW()
     RETURNING *`,
    [
      tenantId,
      planData.id,
      planData.billing_type,
      planData.price,
      planData.commission_percentage,
    ],
  );
}

export async function fetchRevenueReportRows(monthYear: string) {
  return masterPool.query(
    `SELECT
       COUNT(DISTINCT i.tenant_id) as active_billing_tenants,
       SUM(CASE WHEN i.billing_type = 'fixed' THEN i.monthly_fee ELSE 0 END) as fixed_revenue,
       SUM(CASE WHEN i.billing_type = 'revenue_share' THEN i.total ELSE 0 END) as commission_revenue,
       SUM(CASE WHEN i.billing_type = 'hybrid' THEN i.total ELSE 0 END) as hybrid_revenue,
       SUM(i.total) as total_revenue,
       COUNT(CASE WHEN i.status = 'paid' THEN 1 END) as paid_invoices,
       COUNT(CASE WHEN i.status = 'pending' THEN 1 END) as pending_invoices
     FROM invoices i
     WHERE i.month_year = $1`,
    [monthYear],
  );
}

export async function fetchAllInvoices(opts: {
  monthYear?: string;
  status?: string;
  limit: number;
  offset: number;
}) {
  const params: unknown[] = [];
  let query = `
    SELECT i.id, i.invoice_number, i.month_year, i.billing_type, i.total, i.status, i.issue_date,
           t.nome as tenant_name
    FROM invoices i
    JOIN tenants t ON i.tenant_id = t.id
    WHERE 1=1
  `;
  if (opts.monthYear) {
    params.push(opts.monthYear);
    query += ` AND i.month_year = $${params.length}`;
  }
  if (opts.status) {
    params.push(opts.status);
    query += ` AND i.status = $${params.length}`;
  }
  params.push(opts.limit, opts.offset);
  query += ` ORDER BY i.issue_date DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

  return masterPool.query(query, params);
}

export async function fetchTenantBillings() {
  return masterPool.query(
    `SELECT tb.id, tb.tenant_id, t.nome as tenant_name, tb.billing_type, tb.monthly_fee,
            tb.commission_percentage, bp.name as plan_name, tb.status, tb.next_billing_date,
            COUNT(DISTINCT i.id) as invoices_count,
            SUM(CASE WHEN i.status = 'paid' THEN i.total ELSE 0 END) as total_paid
     FROM tenant_billing tb
     JOIN tenants t ON tb.tenant_id = t.id
     JOIN billing_plans bp ON tb.plan_id = bp.id
     LEFT JOIN invoices i ON tb.tenant_id = i.tenant_id
     GROUP BY tb.id, t.id, bp.id
     ORDER BY t.created_at DESC`,
  );
}
