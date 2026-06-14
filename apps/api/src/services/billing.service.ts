import { masterPool } from '../lib/master-db.js';

export interface CommissionTransaction {
  id: string;
  tenant_id: number;
  pedido_id: number | null;
  order_total: number;
  commission_percentage: number;
  commission_amount: number;
  month_year: string;
  status: string;
}

/** Porta `BillingService.recordCommissionOnOrder` — usa banco master. */
export async function recordCommissionOnOrder(
  tenantId: number,
  pedidoId: number,
  orderTotal: number,
): Promise<CommissionTransaction | null> {
  const billing = await masterPool.query<{
    commission_percentage: string | null;
  }>(
    `SELECT tb.*, bp.commission_percentage
     FROM tenant_billing tb
     JOIN billing_plans bp ON tb.plan_id = bp.id
     WHERE tb.tenant_id = $1 AND tb.status = 'active'`,
    [tenantId],
  );

  if (billing.rows.length === 0) return null;

  const config = billing.rows[0]!;
  const pct = parseFloat(String(config.commission_percentage ?? 0));
  if (!pct || pct === 0) return null;

  const commissionAmount = (orderTotal * pct) / 100;
  const monthYear = new Date().toISOString().slice(0, 7);

  const result = await masterPool.query<CommissionTransaction>(
    `INSERT INTO commission_transactions
       (tenant_id, pedido_id, order_total, commission_percentage, commission_amount, month_year, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending')
     RETURNING *`,
    [tenantId, pedidoId, orderTotal, pct, commissionAmount, monthYear],
  );

  return result.rows[0] ?? null;
}

export async function getBillingReport(tenantId: number, monthYear?: string | null) {
  const my = monthYear ?? new Date().toISOString().slice(0, 7);
  const result = await masterPool.query(
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
    [tenantId, my],
  );

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
  const result = await masterPool.query(
    `SELECT id, invoice_number, month_year, billing_type, monthly_fee, total_sales,
            commission_amount, total, status, issue_date, due_date, paid_at
     FROM invoices
     WHERE tenant_id = $1
     ORDER BY issue_date DESC
     LIMIT $2`,
    [tenantId, limit],
  );
  return result.rows;
}

export async function getInvoice(tenantId: number, invoiceId: string) {
  const result = await masterPool.query(
    `SELECT * FROM invoices WHERE id = $1 AND tenant_id = $2`,
    [invoiceId, tenantId],
  );
  if (result.rows.length === 0) return null;

  const invoice = result.rows[0] as Record<string, unknown>;
  if (invoice.billing_type === 'revenue_share' || invoice.billing_type === 'hybrid') {
    const commissions = await masterPool.query(
      `SELECT pedido_id, order_total, commission_percentage, commission_amount, created_at
       FROM commission_transactions
       WHERE invoice_id = $1
       ORDER BY created_at DESC`,
      [invoiceId],
    );
    invoice.commissions = commissions.rows;
  }
  return invoice;
}

export async function getMyBilling(tenantId: number) {
  const result = await masterPool.query(
    `SELECT tb.id, tb.billing_type, tb.monthly_fee, tb.commission_percentage,
            bp.name as plan_name, bp.slug as plan_slug, bp.features,
            tb.status, tb.next_billing_date, tb.created_at
     FROM tenant_billing tb
     JOIN billing_plans bp ON tb.plan_id = bp.id
     WHERE tb.tenant_id = $1`,
    [tenantId],
  );
  return result.rows[0] ?? null;
}

export async function listPlans() {
  const result = await masterPool.query(
    `SELECT id, name, slug, description, price, billing_type, commission_percentage, features, created_at
     FROM billing_plans
     ORDER BY price ASC NULLS LAST`,
  );
  return result.rows;
}

export async function assignPlanToTenant(tenantId: number, planSlug: string) {
  const plan = await masterPool.query(`SELECT * FROM billing_plans WHERE slug = $1`, [planSlug]);
  if (plan.rows.length === 0) throw new Error('Plano não encontrado');

  const planData = plan.rows[0] as Record<string, unknown>;
  const result = await masterPool.query(
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
  return result.rows[0];
}

export async function getRevenueReport(monthYear?: string | null) {
  const my = monthYear ?? new Date().toISOString().slice(0, 7);
  const result = await masterPool.query(
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
    [my],
  );
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
  params.push(limit, offset);
  query += ` ORDER BY i.issue_date DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

  const result = await masterPool.query(query, params);
  return result.rows;
}

export async function listTenantBillings() {
  const result = await masterPool.query(
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
  return result.rows;
}
