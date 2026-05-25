const db = require('../config/db');
const BillingService = require('../services/billingService');

/**
 * Script para gerar invoices mensais
 * Executar: node scripts/generate-invoices.js [monthYear]
 *
 * Exemplos:
 *   node scripts/generate-invoices.js           (usa mês atual)
 *   node scripts/generate-invoices.js 2026-04   (gera para abril 2026)
 */

async function generateMonthlyInvoices() {
  try {
    // Obter mês/ano
    const monthYear = process.argv[2] || new Date().toISOString().slice(0, 7);

    console.log(`\n🧾 Gerando invoices para ${monthYear}...\n`);

    // Obter todos os tenants com billing ativo
    const tenants = await db.query(`
      SELECT DISTINCT tb.tenant_id
      FROM tenant_billing tb
      WHERE tb.status = 'active'
      ORDER BY tb.created_at DESC
    `);

    if (tenants.rows.length === 0) {
      console.log('⚠️ Nenhum tenant com billing ativo encontrado');
      process.exit(0);
    }

    const results = {
      success: 0,
      error: 0,
      total: tenants.rows.length,
      invoices: []
    };

    // Gerar invoice para cada tenant
    for (const row of tenants.rows) {
      try {
        const tenantId = row.tenant_id;

        // Verificar se já existe invoice para esse mês
        const existing = await db.query(`
          SELECT id FROM invoices
          WHERE tenant_id = $1 AND month_year = $2
        `, [tenantId, monthYear]);

        if (existing.rows.length > 0) {
          console.log(`⏭️  Pulando ${tenantId} (invoice já existe)`);
          continue;
        }

        // Gerar nova invoice
        const invoice = await BillingService.generateMonthlyInvoice(tenantId, monthYear);

        results.success++;
        results.invoices.push({
          tenant_id: tenantId,
          invoice_number: invoice.invoice_number,
          total: parseFloat(invoice.total),
          status: invoice.status
        });

        // Buscar nome do tenant para log
        const tenant = await db.query('SELECT name FROM tenants WHERE id = $1', [tenantId]);
        console.log(`✅ ${tenant.rows[0]?.name || tenantId}: ${invoice.invoice_number} - R$ ${invoice.total}`);

      } catch (error) {
        results.error++;
        console.error(`❌ Erro ao gerar invoice para tenant: ${error.message}`);
      }
    }

    // Relatório final
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`📊 RESUMO DA GERAÇÃO DE INVOICES (${monthYear})`);
    console.log(`${'─'.repeat(60)}`);
    console.log(`✅ Sucesso:    ${results.success}/${results.total}`);
    console.log(`❌ Erros:      ${results.error}/${results.total}`);
    console.log(`💰 Total:      R$ ${results.invoices.reduce((sum, inv) => sum + inv.total, 0).toFixed(2)}`);
    console.log(`${'─'.repeat(60)}\n`);

    // Resumo por tipo de billing
    const byType = {};
    for (const inv of results.invoices) {
      const billing = await db.query(`
        SELECT billing_type FROM invoices WHERE invoice_number = $1
      `, [inv.invoice_number]);

      if (billing.rows[0]) {
        const type = billing.rows[0].billing_type;
        byType[type] = (byType[type] || 0) + inv.total;
      }
    }

    if (Object.keys(byType).length > 0) {
      console.log('💵 Receita por Tipo de Billing:');
      for (const [type, amount] of Object.entries(byType)) {
        console.log(`  - ${type}: R$ ${amount.toFixed(2)}`);
      }
      console.log('');
    }

    process.exit(results.error > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Erro crítico:', error.message);
    process.exit(1);
  }
}

// Executar
generateMonthlyInvoices();
