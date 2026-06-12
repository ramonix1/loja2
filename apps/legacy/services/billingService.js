const db = require('../config/db');

class BillingService {
  /**
   * Registrar uma transaÃ§Ã£o de comissÃ£o quando pedido Ã© criado
   * Chamado quando novo pedido Ã© confirmado
   */
  static async recordCommissionOnOrder(tenantId, pedidoId, orderTotal) {
    try {
      // Obter config de billing do tenant
      const billing = await db.query(`
        SELECT tb.*, bp.commission_percentage
        FROM tenant_billing tb
        JOIN billing_plans bp ON tb.plan_id = bp.id
        WHERE tb.tenant_id = $1 AND tb.status = 'active'
      `, [tenantId]);

      if (billing.rows.length === 0) {
        console.log(` Tenant ${tenantId} nÃ£o tem billing configurado`);
        return null;
      }

      const config = billing.rows[0];

      // Se nÃ£o tem comissÃ£o, nÃ£o registra
      if (!config.commission_percentage || config.commission_percentage === 0) {
        return null;
      }

      const commissionAmount = (orderTotal * config.commission_percentage) / 100;
      const monthYear = new Date().toISOString().slice(0, 7); // '2026-05'

      // Registrar transaÃ§Ã£o de comissÃ£o
      const result = await db.query(`
        INSERT INTO commission_transactions
        (tenant_id, pedido_id, order_total, commission_percentage, commission_amount, month_year, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'pending')
        RETURNING *
      `, [tenantId, pedidoId, orderTotal, config.commission_percentage, commissionAmount, monthYear]);

      console.log(`[OK] ComissÃ£o registrada: ${commissionAmount.toFixed(2)} para tenant ${tenantId}`);
      return result.rows[0];
    } catch (error) {
      console.error('[ERRO] Erro ao registrar comissÃ£o:', error);
      throw error;
    }
  }

  /**
   * Gerar invoice mensal para um tenant
   * Deve ser chamado no inÃcio de cada mÃªs
   */
  static async generateMonthlyInvoice(tenantId, monthYear) {
    try {
      const client = await db.connect();

      try {
        await client.query('BEGIN');

        // Obter config de billing
        const billing = await client.query(`
          SELECT tb.*, bp.billing_type, bp.price
          FROM tenant_billing tb
          JOIN billing_plans bp ON tb.plan_id = bp.id
          WHERE tb.tenant_id = $1
        `, [tenantId]);

        if (billing.rows.length === 0) {
          throw new Error('Billing nÃ£o configurado para este tenant');
        }

        const config = billing.rows[0];
        const tenant = await client.query('SELECT name FROM tenants WHERE id = $1', [tenantId]);

        let invoiceData = {
          subtotal: 0,
          total: 0,
          invoiceNumber: this.generateInvoiceNumber(tenantId, monthYear),
          billingType: config.billing_type,
          monthYear
        };

        // Calcular baseado no tipo de billing
        if (config.billing_type === 'fixed') {
          invoiceData.monthlyFee = config.price;
          invoiceData.subtotal = config.price;
          invoiceData.total = config.price;
        } else if (config.billing_type === 'revenue_share') {
          // Somar comissÃµes do mÃªs
          const commissions = await client.query(`
            SELECT
              SUM(order_total) as total_sales,
              SUM(commission_amount) as total_commission,
              commission_percentage
            FROM commission_transactions
            WHERE tenant_id = $1 AND month_year = $2 AND status = 'pending'
            GROUP BY commission_percentage
          `, [tenantId, monthYear]);

          if (commissions.rows.length > 0) {
            const comm = commissions.rows[0];
            invoiceData.totalSales = parseFloat(comm.total_sales || 0);
            invoiceData.commissionPercentage = comm.commission_percentage;
            invoiceData.commissionAmount = parseFloat(comm.total_commission || 0);
            invoiceData.subtotal = invoiceData.commissionAmount;
            invoiceData.total = invoiceData.commissionAmount;
          }
        } else if (config.billing_type === 'hybrid') {
          // Mensal + comissÃ£o
          invoiceData.monthlyFee = config.price;

          const commissions = await client.query(`
            SELECT
              SUM(order_total) as total_sales,
              SUM(commission_amount) as total_commission,
              commission_percentage
            FROM commission_transactions
            WHERE tenant_id = $1 AND month_year = $2 AND status = 'pending'
            GROUP BY commission_percentage
          `, [tenantId, monthYear]);

          if (commissions.rows.length > 0) {
            const comm = commissions.rows[0];
            invoiceData.totalSales = parseFloat(comm.total_sales || 0);
            invoiceData.commissionPercentage = comm.commission_percentage;
            invoiceData.commissionAmount = parseFloat(comm.total_commission || 0);
          }

          invoiceData.subtotal = (invoiceData.monthlyFee || 0) + (invoiceData.commissionAmount || 0);
          invoiceData.total = invoiceData.subtotal;
        }

        // Criar invoice
        const invoice = await client.query(`
          INSERT INTO invoices
          (tenant_id, invoice_number, month_year, billing_type, monthly_fee, total_sales,
           commission_percentage, commission_amount, subtotal, total, due_date)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                  NOW() + INTERVAL '7 days')
          RETURNING *
        `, [
          tenantId,
          invoiceData.invoiceNumber,
          monthYear,
          invoiceData.billingType,
          invoiceData.monthlyFee || null,
          invoiceData.totalSales || null,
          invoiceData.commissionPercentage || null,
          invoiceData.commissionAmount || null,
          invoiceData.subtotal,
          invoiceData.total
        ]);

        // Marcar comissÃµes como invoiced
        await client.query(`
          UPDATE commission_transactions
          SET status = 'invoiced', invoice_id = $1
          WHERE tenant_id = $2 AND month_year = $3 AND status = 'pending'
        `, [invoice.rows[0].id, tenantId, monthYear]);

        await client.query('COMMIT');

        console.log(`[OK] Invoice gerada: ${invoiceData.invoiceNumber} - R$ ${invoiceData.total}`);
        return invoice.rows[0];
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('[ERRO] Erro ao gerar invoice:', error);
      throw error;
    }
  }

  /**
   * Atribuir plano a um novo tenant
   */
  static async assignPlanToTenant(tenantId, planSlug) {
    try {
      // Obter plano
      const plan = await db.query(
        'SELECT * FROM billing_plans WHERE slug = $1',
        [planSlug]
      );

      if (plan.rows.length === 0) {
        throw new Error('Plano nÃ£o encontrado');
      }

      const planData = plan.rows[0];

      // Criar configuraÃ§Ã£o de billing
      const result = await db.query(`
        INSERT INTO tenant_billing
        (tenant_id, plan_id, billing_type, monthly_fee, commission_percentage, next_billing_date, status)
        VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '1 month', 'active')
        ON CONFLICT (tenant_id) DO UPDATE SET
          plan_id = $2,
          billing_type = $3,
          monthly_fee = $4,
          commission_percentage = $5,
          updated_at = NOW()
        RETURNING *
      `, [
        tenantId,
        planData.id,
        planData.billing_type,
        planData.price,
        planData.commission_percentage
      ]);

      console.log(`[OK] Plano ${planSlug} atribuÃdo ao tenant ${tenantId}`);
      return result.rows[0];
    } catch (error) {
      console.error('[ERRO] Erro ao atribuir plano:', error);
      throw error;
    }
  }

  /**
   * Obter relatÃ³rio de faturamento
   */
  static async getBillingReport(tenantId, monthYear = null) {
    try {
      if (!monthYear) {
        monthYear = new Date().toISOString().slice(0, 7);
      }

      const result = await db.query(`
        SELECT
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
        GROUP BY tb.id, i.id
      `, [tenantId, monthYear]);

      if (result.rows.length === 0) {
        return { error: 'Sem dados de faturamento' };
      }

      const data = result.rows[0];
      return {
        month: monthYear,
        billingType: data.billing_type,
        monthlyFee: data.monthly_fee,
        commissionPercentage: data.commission_percentage,
        orders: {
          total: parseInt(data.total_orders),
          totalSales: parseFloat(data.total_sales),
          totalCommission: parseFloat(data.total_commission)
        },
        invoice: {
          number: data.invoice_number,
          total: parseFloat(data.invoice_total),
          status: data.invoice_status
        }
      };
    } catch (error) {
      console.error('[ERRO] Erro ao gerar relatÃ³rio:', error);
      throw error;
    }
  }

  /**
   * Listar invoices de um tenant
   */
  static async listInvoices(tenantId, limit = 12) {
    try {
      const result = await db.query(`
        SELECT
          id,
          invoice_number,
          month_year,
          billing_type,
          monthly_fee,
          total_sales,
          commission_amount,
          total,
          status,
          issue_date,
          due_date,
          paid_at
        FROM invoices
        WHERE tenant_id = $1
        ORDER BY issue_date DESC
        LIMIT $2
      `, [tenantId, limit]);

      return result.rows;
    } catch (error) {
      console.error('[ERRO] Erro ao listar invoices:', error);
      throw error;
    }
  }

  /**
   * Obter resumo de receita (Super Admin)
   */
  static async getRevenueReport(monthYear = null) {
    try {
      if (!monthYear) {
        monthYear = new Date().toISOString().slice(0, 7);
      }

      const result = await db.query(`
        SELECT
          COUNT(DISTINCT i.tenant_id) as active_billing_tenants,
          SUM(CASE WHEN i.billing_type = 'fixed' THEN i.monthly_fee ELSE 0 END) as fixed_revenue,
          SUM(CASE WHEN i.billing_type = 'revenue_share' THEN i.total ELSE 0 END) as commission_revenue,
          SUM(CASE WHEN i.billing_type = 'hybrid' THEN i.total ELSE 0 END) as hybrid_revenue,
          SUM(i.total) as total_revenue,
          COUNT(CASE WHEN i.status = 'paid' THEN 1 END) as paid_invoices,
          COUNT(CASE WHEN i.status = 'pending' THEN 1 END) as pending_invoices
        FROM invoices i
        WHERE i.month_year = $1
      `, [monthYear]);

      const data = result.rows[0];
      return {
        month: monthYear,
        activeTenants: parseInt(data.active_billing_tenants || 0),
        revenue: {
          fixed: parseFloat(data.fixed_revenue || 0),
          commission: parseFloat(data.commission_revenue || 0),
          hybrid: parseFloat(data.hybrid_revenue || 0),
          total: parseFloat(data.total_revenue || 0)
        },
        invoices: {
          paid: parseInt(data.paid_invoices || 0),
          pending: parseInt(data.pending_invoices || 0)
        }
      };
    } catch (error) {
      console.error('[ERRO] Erro ao gerar revenue report:', error);
      throw error;
    }
  }

  /**
   * Gerar nÃºmero de invoice Ãºnico
   */
  static generateInvoiceNumber(tenantId, monthYear) {
    // Formato: INV-2026-05-abc123 (INV-YYYY-MM-TENANTID)
    const shortId = tenantId.slice(0, 6).toUpperCase();
    return `INV-${monthYear}-${shortId}`;
  }
}

module.exports = BillingService;
