const db = require('../config/db');
const BillingService = require('../services/billingService');

/**
 * SUPER ADMIN: Listar planos disponÃveis
 */
exports.listPlans = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        id,
        name,
        slug,
        description,
        price,
        billing_type,
        commission_percentage,
        features,
        created_at
      FROM billing_plans
      ORDER BY price ASC NULLS LAST
    `);

    res.json({
      plans: result.rows
    });
  } catch (error) {
    console.error('[ERRO] listPlans error:', error);
    res.status(500).json({ error: 'Erro ao listar planos' });
  }
};

/**
 * SUPER ADMIN: Atribuir plano a um tenant
 */
exports.assignPlanToTenant = async (req, res) => {
  try {
    // Validar super admin
    if (req.session.user?.email !== 'ramon.oliveira08@gmail.com') {
      return res.status(403).json({ error: 'NÃ£o autorizado' });
    }

    const { tenantId } = req.params;
    const { planSlug } = req.body;

    if (!planSlug) {
      return res.status(400).json({ error: 'planSlug Ã© obrigatÃ³rio' });
    }

    // Atribuir plano
    const billing = await BillingService.assignPlanToTenant(tenantId, planSlug);

    res.json({
      success: true,
      message: 'Plano atribuÃdo com sucesso',
      billing
    });
  } catch (error) {
    console.error('[ERRO] assignPlanToTenant error:', error);
    res.status(500).json({ error: error.message || 'Erro ao atribuir plano' });
  }
};

/**
 * CLIENTE: Ver sua configuraÃ§Ã£o de billing
 */
exports.getMyBilling = async (req, res) => {
  try {
    const tenantId = req.session.tenant_id;

    const result = await db.query(`
      SELECT
        tb.id,
        tb.billing_type,
        tb.monthly_fee,
        tb.commission_percentage,
        bp.name as plan_name,
        bp.slug as plan_slug,
        bp.features,
        tb.status,
        tb.next_billing_date,
        tb.created_at
      FROM tenant_billing tb
      JOIN billing_plans bp ON tb.plan_id = bp.id
      WHERE tb.tenant_id = $1
    `, [tenantId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ConfiguraÃ§Ã£o de billing nÃ£o encontrada' });
    }

    res.json({
      billing: result.rows[0]
    });
  } catch (error) {
    console.error('[ERRO] getMyBilling error:', error);
    res.status(500).json({ error: 'Erro ao buscar configuraÃ§Ã£o de billing' });
  }
};

/**
 * CLIENTE: Ver relatÃ³rio de faturamento (seu mÃªs)
 */
exports.getMyBillingReport = async (req, res) => {
  try {
    const tenantId = req.session.tenant_id;
    const { monthYear } = req.query;

    const report = await BillingService.getBillingReport(tenantId, monthYear);

    res.json(report);
  } catch (error) {
    console.error('[ERRO] getMyBillingReport error:', error);
    res.status(500).json({ error: 'Erro ao gerar relatÃ³rio' });
  }
};

/**
 * CLIENTE: Listar suas invoices
 */
exports.listMyInvoices = async (req, res) => {
  try {
    const tenantId = req.session.tenant_id;
    const { limit = 12 } = req.query;

    const invoices = await BillingService.listInvoices(tenantId, limit);

    res.json({
      invoices
    });
  } catch (error) {
    console.error('[ERRO] listMyInvoices error:', error);
    res.status(500).json({ error: 'Erro ao listar invoices' });
  }
};

/**
 * CLIENTE: Ver uma invoice especÃfica
 */
exports.getInvoice = async (req, res) => {
  try {
    const tenantId = req.session.tenant_id;
    const { invoiceId } = req.params;

    const result = await db.query(`
      SELECT *
      FROM invoices
      WHERE id = $1 AND tenant_id = $2
    `, [invoiceId, tenantId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice nÃ£o encontrada' });
    }

    // Se for revenue share, listar as comissÃµes que compÃµem a invoice
    const invoice = result.rows[0];

    if (invoice.billing_type === 'revenue_share' || invoice.billing_type === 'hybrid') {
      const commissions = await db.query(`
        SELECT
          pedido_id,
          order_total,
          commission_percentage,
          commission_amount,
          created_at
        FROM commission_transactions
        WHERE invoice_id = $1
        ORDER BY created_at DESC
      `, [invoiceId]);

      invoice.commissions = commissions.rows;
    }

    res.json({
      invoice
    });
  } catch (error) {
    console.error('[ERRO] getInvoice error:', error);
    res.status(500).json({ error: 'Erro ao buscar invoice' });
  }
};

/**
 * SUPER ADMIN: RelatÃ³rio de receita (todos clientes)
 */
exports.getRevenueReport = async (req, res) => {
  try {
    // Validar super admin
    if (req.session.user?.email !== 'ramon.oliveira08@gmail.com') {
      return res.status(403).json({ error: 'NÃ£o autorizado' });
    }

    const { monthYear } = req.query;

    const report = await BillingService.getRevenueReport(monthYear);

    res.json(report);
  } catch (error) {
    console.error('[ERRO] getRevenueReport error:', error);
    res.status(500).json({ error: 'Erro ao gerar relatÃ³rio de receita' });
  }
};

/**
 * SUPER ADMIN: Listar invoices de todos clientes
 */
exports.listAllInvoices = async (req, res) => {
  try {
    // Validar super admin
    if (req.session.user?.email !== 'ramon.oliveira08@gmail.com') {
      return res.status(403).json({ error: 'NÃ£o autorizado' });
    }

    const { monthYear, status, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT
        i.id,
        i.invoice_number,
        i.month_year,
        i.billing_type,
        i.total,
        i.status,
        i.issue_date,
        t.name as tenant_name,
        t.email as tenant_email
      FROM invoices i
      JOIN tenants t ON i.tenant_id = t.id
      WHERE 1=1
    `;

    const params = [];

    if (monthYear) {
      query += ` AND i.month_year = $${params.length + 1}`;
      params.push(monthYear);
    }

    if (status) {
      query += ` AND i.status = $${params.length + 1}`;
      params.push(status);
    }

    query += ` ORDER BY i.issue_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    const total = await db.query(`
      SELECT COUNT(*) FROM invoices i
      WHERE 1=1
      ${monthYear ? `AND i.month_year = $1` : ''}
      ${status ? `AND i.status = ${monthYear ? '$2' : '$1'}` : ''}
    `, monthYear && status ? [monthYear, status] : monthYear ? [monthYear] : status ? [status] : []);

    res.json({
      invoices: result.rows,
      pagination: {
        total: parseInt(total.rows[0].count),
        limit,
        offset
      }
    });
  } catch (error) {
    console.error('[ERRO] listAllInvoices error:', error);
    res.status(500).json({ error: 'Erro ao listar invoices' });
  }
};

/**
 * SUPER ADMIN: Listar config de billing de todos tenants
 */
exports.listTenantBillings = async (req, res) => {
  try {
    // Validar super admin
    if (req.session.user?.email !== 'ramon.oliveira08@gmail.com') {
      return res.status(403).json({ error: 'NÃ£o autorizado' });
    }

    const result = await db.query(`
      SELECT
        tb.id,
        tb.tenant_id,
        t.name as tenant_name,
        t.email as tenant_email,
        tb.billing_type,
        tb.monthly_fee,
        tb.commission_percentage,
        bp.name as plan_name,
        tb.status,
        tb.next_billing_date,
        COUNT(DISTINCT i.id) as invoices_count,
        SUM(CASE WHEN i.status = 'paid' THEN i.total ELSE 0 END) as total_paid
      FROM tenant_billing tb
      JOIN tenants t ON tb.tenant_id = t.id
      JOIN billing_plans bp ON tb.plan_id = bp.id
      LEFT JOIN invoices i ON tb.tenant_id = i.tenant_id
      GROUP BY tb.id, t.id, bp.id
      ORDER BY t.created_at DESC
    `);

    res.json({
      billings: result.rows
    });
  } catch (error) {
    console.error('[ERRO] listTenantBillings error:', error);
    res.status(500).json({ error: 'Erro ao listar configuraÃ§Ãµes de billing' });
  }
};
