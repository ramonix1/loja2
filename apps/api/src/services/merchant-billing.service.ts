import { MERCHANT_PLAN_MAX_STORES, type MerchantAccountPlan } from '@lojao/types/merchant';
import { SIGNUP_PLANS } from '@lojao/types/signup';

import { masterPool } from '../lib/master-db.js';

const TRIAL_DAYS = 14;

export interface MerchantCommissionTransaction {
  id: string;
  merchant_id: number;
  order_id: number | null;
  order_total: number;
  commission_percentage: number;
  commission_amount: number;
  month_year: string;
  status: string;
}

async function ensureBillingPlan(planSlug: MerchantAccountPlan): Promise<string> {
  const plan = SIGNUP_PLANS.find((p) => p.slug === planSlug);
  if (!plan) throw new Error('Plano não encontrado');

  await masterPool.query(
    `INSERT INTO billing_plans (name, slug, billing_type, price)
     VALUES ($1, $2, 'fixed', $3)
     ON CONFLICT (slug) DO NOTHING`,
    [plan.name, plan.slug, plan.priceMonthly],
  );

  const res = await masterPool.query<{ id: string }>(
    'SELECT id FROM billing_plans WHERE slug = $1',
    [plan.slug],
  );
  return res.rows[0]!.id;
}

function resolveMaxStores(planSlug: MerchantAccountPlan, customMaxStores?: number | null): number {
  if (planSlug === 'enterprise') {
    if (customMaxStores == null || customMaxStores < 1) {
      throw new Error('Plano Enterprise exige customMaxStores.');
    }
    return customMaxStores;
  }
  return MERCHANT_PLAN_MAX_STORES[planSlug];
}

async function syncMerchantMaxStores(merchantId: number, maxStores: number): Promise<void> {
  await masterPool.query('UPDATE merchants SET max_stores = $2 WHERE id = $1', [
    merchantId,
    maxStores,
  ]);
}

/**
 * MA7 — registra trial de 14d em `merchant_billing` (spec §2.5 passo 3).
 * Reutiliza `billing_plans` compartilhada com o modelo tenant legado.
 */
export async function registerMerchantTrialBilling(
  merchantId: number,
  planSlug: MerchantAccountPlan,
): Promise<Date> {
  if (planSlug === 'enterprise') {
    throw new Error('Plano Enterprise não suporta trial self-service.');
  }
  const planId = await ensureBillingPlan(planSlug);
  const plan = SIGNUP_PLANS.find((p) => p.slug === planSlug)!;
  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  await masterPool.query(
    `INSERT INTO merchant_billing
       (merchant_id, plan_id, billing_type, monthly_fee, trial_ends_at, next_billing_date, status)
     VALUES ($1, $2, 'fixed', $3, $4, $4, 'trialing')
     ON CONFLICT (merchant_id) DO UPDATE SET
       plan_id = $2, billing_type = 'fixed', monthly_fee = $3,
       trial_ends_at = $4, next_billing_date = $4, status = 'trialing', updated_at = NOW()`,
    [merchantId, planId, plan.priceMonthly, trialEndsAt],
  );

  return trialEndsAt;
}

/** Atribui plano a uma conta merchant (Platform Hub / pós-trial). */
export async function assignPlanToMerchant(
  merchantId: number,
  planSlug: MerchantAccountPlan,
  opts: { customMaxStores?: number } = {},
) {
  const planId = await ensureBillingPlan(planSlug);
  const plan = SIGNUP_PLANS.find((p) => p.slug === planSlug)!;
  const maxStores = resolveMaxStores(planSlug, opts.customMaxStores);

  const result = await masterPool.query(
    `INSERT INTO merchant_billing
       (merchant_id, plan_id, billing_type, monthly_fee, custom_max_stores,
        next_billing_date, status, trial_ends_at)
     VALUES ($1, $2, 'fixed', $3, $4, NOW() + INTERVAL '1 month', 'active', NULL)
     ON CONFLICT (merchant_id) DO UPDATE SET
       plan_id = $2, billing_type = 'fixed', monthly_fee = $3,
       custom_max_stores = $4, next_billing_date = NOW() + INTERVAL '1 month',
       status = 'active', trial_ends_at = NULL, updated_at = NOW()
     RETURNING *`,
    [
      merchantId,
      planId,
      plan.priceMonthly,
      planSlug === 'enterprise' ? maxStores : null,
    ],
  );

  await syncMerchantMaxStores(merchantId, maxStores);
  return result.rows[0];
}

export async function getMerchantBilling(merchantId: number) {
  const result = await masterPool.query(
    `SELECT mb.id, mb.billing_type, mb.monthly_fee, mb.commission_percentage,
            mb.status, mb.trial_ends_at, mb.next_billing_date, mb.custom_max_stores,
            mb.created_at, bp.name AS plan_name, bp.slug AS plan_slug, bp.features,
            m.max_stores
     FROM merchant_billing mb
     JOIN billing_plans bp ON mb.plan_id = bp.id
     JOIN merchants m ON mb.merchant_id = m.id
     WHERE mb.merchant_id = $1`,
    [merchantId],
  );
  return result.rows[0] ?? null;
}

/** Porta merchant de `BillingService.recordCommissionOnOrder` — usa `merchant_id`. */
export async function recordCommissionOnMerchantOrder(
  merchantId: number,
  orderId: number,
  orderTotal: number,
): Promise<MerchantCommissionTransaction | null> {
  const billing = await masterPool.query<{ commission_percentage: string | null }>(
    `SELECT mb.*, bp.commission_percentage
     FROM merchant_billing mb
     JOIN billing_plans bp ON mb.plan_id = bp.id
     WHERE mb.merchant_id = $1 AND mb.status IN ('active', 'trialing')`,
    [merchantId],
  );

  if (billing.rows.length === 0) return null;

  const config = billing.rows[0]!;
  const pct = parseFloat(String(config.commission_percentage ?? 0));
  if (!pct || pct === 0) return null;

  const commissionAmount = (orderTotal * pct) / 100;
  const monthYear = new Date().toISOString().slice(0, 7);

  const result = await masterPool.query<MerchantCommissionTransaction>(
    `INSERT INTO merchant_commission_transactions
       (merchant_id, order_id, order_total, commission_percentage, commission_amount, month_year, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending')
     RETURNING *`,
    [merchantId, orderId, orderTotal, pct, commissionAmount, monthYear],
  );

  return result.rows[0] ?? null;
}

export async function getMerchantBillingReport(merchantId: number, monthYear?: string | null) {
  const my = monthYear ?? new Date().toISOString().slice(0, 7);
  const result = await masterPool.query(
    `SELECT
       mb.billing_type,
       mb.monthly_fee,
       mb.commission_percentage,
       COUNT(DISTINCT ct.id) AS total_orders,
       COALESCE(SUM(ct.order_total), 0) AS total_sales,
       COALESCE(SUM(ct.commission_amount), 0) AS total_commission,
       i.invoice_number,
       i.total AS invoice_total,
       i.status AS invoice_status
     FROM merchant_billing mb
     LEFT JOIN merchant_commission_transactions ct
       ON mb.merchant_id = ct.merchant_id AND ct.month_year = $2
     LEFT JOIN merchant_invoices i
       ON mb.merchant_id = i.merchant_id AND i.month_year = $2
     WHERE mb.merchant_id = $1
     GROUP BY mb.id, i.id`,
    [merchantId, my],
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

export async function listMerchantInvoices(merchantId: number, limit = 12) {
  const result = await masterPool.query(
    `SELECT id, invoice_number, month_year, billing_type, monthly_fee, total_sales,
            commission_amount, total, status, issue_date, due_date, paid_at
     FROM merchant_invoices
     WHERE merchant_id = $1
     ORDER BY issue_date DESC
     LIMIT $2`,
    [merchantId, limit],
  );
  return result.rows;
}

export async function getMerchantInvoice(merchantId: number, invoiceId: string) {
  const result = await masterPool.query(
    `SELECT * FROM merchant_invoices WHERE id = $1 AND merchant_id = $2`,
    [invoiceId, merchantId],
  );
  if (result.rows.length === 0) return null;

  const invoice = result.rows[0] as Record<string, unknown>;
  if (invoice.billing_type === 'revenue_share' || invoice.billing_type === 'hybrid') {
    const commissions = await masterPool.query(
      `SELECT order_id, order_total, commission_percentage, commission_amount, created_at
       FROM merchant_commission_transactions
       WHERE invoice_id = $1
       ORDER BY created_at DESC`,
      [invoiceId],
    );
    invoice.commissions = commissions.rows;
  }
  return invoice;
}

export async function listMerchantBillings() {
  const result = await masterPool.query(
    `SELECT mb.id, mb.merchant_id, m.name AS merchant_name, m.slug AS merchant_slug,
            mb.billing_type, mb.monthly_fee, mb.commission_percentage, mb.status,
            mb.trial_ends_at, mb.next_billing_date, mb.custom_max_stores,
            bp.name AS plan_name, bp.slug AS plan_slug,
            COUNT(DISTINCT i.id) AS invoices_count,
            SUM(CASE WHEN i.status = 'paid' THEN i.total ELSE 0 END) AS total_paid
     FROM merchant_billing mb
     JOIN merchants m ON mb.merchant_id = m.id
     JOIN billing_plans bp ON mb.plan_id = bp.id
     LEFT JOIN merchant_invoices i ON mb.merchant_id = i.merchant_id
     GROUP BY mb.id, m.id, bp.id
     ORDER BY m.created_at DESC`,
  );
  return result.rows;
}

export async function getMerchantRevenueReport(monthYear?: string | null) {
  const my = monthYear ?? new Date().toISOString().slice(0, 7);
  const result = await masterPool.query(
    `SELECT
       COUNT(DISTINCT i.merchant_id) AS active_billing_merchants,
       SUM(CASE WHEN i.billing_type = 'fixed' THEN i.monthly_fee ELSE 0 END) AS fixed_revenue,
       SUM(CASE WHEN i.billing_type = 'revenue_share' THEN i.total ELSE 0 END) AS commission_revenue,
       SUM(CASE WHEN i.billing_type = 'hybrid' THEN i.total ELSE 0 END) AS hybrid_revenue,
       SUM(i.total) AS total_revenue,
       COUNT(CASE WHEN i.status = 'paid' THEN 1 END) AS paid_invoices,
       COUNT(CASE WHEN i.status = 'pending' THEN 1 END) AS pending_invoices
     FROM merchant_invoices i
     WHERE i.month_year = $1`,
    [my],
  );
  const data = result.rows[0] as Record<string, unknown>;
  return {
    month: my,
    activeMerchants: parseInt(String(data.active_billing_merchants ?? 0), 10),
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
