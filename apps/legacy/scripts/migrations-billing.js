const db = require('../config/db');

const migrations = [
  {
    id: '001_create_billing_tables',
    description: 'Criar tabelas para modelo hÃbrido de faturamento',
    up: `
      -- Tabela de planos
      CREATE TABLE IF NOT EXISTS billing_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        price DECIMAL(10, 2),
        billing_type VARCHAR(50) NOT NULL,  -- 'fixed', 'revenue_share', 'hybrid'
        commission_percentage DECIMAL(5, 2),
        features TEXT[] DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Tabela de configuraÃ§Ã£o de billing por tenant
      CREATE TABLE IF NOT EXISTS tenant_billing (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        plan_id UUID NOT NULL REFERENCES billing_plans(id),
        billing_type VARCHAR(50) NOT NULL,  -- 'fixed', 'revenue_share'
        monthly_fee DECIMAL(10, 2),
        commission_percentage DECIMAL(5, 2),
        trial_ends_at TIMESTAMP,
        next_billing_date TIMESTAMP,
        status VARCHAR(50) DEFAULT 'active',  -- 'active', 'canceled', 'suspended'
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(tenant_id)
      );

      -- Tabela de faturas/invoices
      CREATE TABLE IF NOT EXISTS invoices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        month_year VARCHAR(7) NOT NULL,  -- '2026-05'
        billing_type VARCHAR(50) NOT NULL,

        -- Para plano fixo
        monthly_fee DECIMAL(10, 2),

        -- Para revenue share
        total_sales DECIMAL(15, 2),
        commission_percentage DECIMAL(5, 2),
        commission_amount DECIMAL(10, 2),

        -- Status
        subtotal DECIMAL(10, 2),
        taxes DECIMAL(10, 2) DEFAULT 0,
        total DECIMAL(10, 2),

        status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'sent', 'paid', 'overdue'
        issue_date TIMESTAMP DEFAULT NOW(),
        due_date TIMESTAMP,
        paid_at TIMESTAMP,

        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Tabela de transaÃ§Ãµes de comissÃ£o
      CREATE TABLE IF NOT EXISTS commission_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        invoice_id UUID REFERENCES invoices(id),
        pedido_id UUID,  -- referÃªncia ao pedido que gerou a comissÃ£o

        order_total DECIMAL(10, 2) NOT NULL,
        commission_percentage DECIMAL(5, 2) NOT NULL,
        commission_amount DECIMAL(10, 2) NOT NULL,

        month_year VARCHAR(7) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'invoiced', 'paid'

        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Ãndices para performance
      CREATE INDEX idx_tenant_billing ON tenant_billing(tenant_id);
      CREATE INDEX idx_invoices_tenant ON invoices(tenant_id);
      CREATE INDEX idx_invoices_month_year ON invoices(month_year);
      CREATE INDEX idx_commission_tenant ON commission_transactions(tenant_id);
      CREATE INDEX idx_commission_month ON commission_transactions(month_year);
    `,
    down: `
      DROP TABLE IF EXISTS commission_transactions CASCADE;
      DROP TABLE IF EXISTS invoices CASCADE;
      DROP TABLE IF EXISTS tenant_billing CASCADE;
      DROP TABLE IF EXISTS billing_plans CASCADE;
    `
  }
];

async function runMigrations(direction = 'up') {
  try {
    console.log(` Executando migrations de billing (${direction})...`);

    for (const migration of migrations) {
      const sql = migration[direction];
      console.log(`  ${direction === 'up' ? '' : ''} ${migration.id}...`);
      console.log(`     ${migration.description}`);
      await db.query(sql);
      console.log(`  ${migration.id}`);
    }

    console.log('Migrations de billing concluÃdas!');
    process.exit(0);
  } catch (error) {
    console.error('[ERRO] Erro:', error.message);
    process.exit(1);
  }
}

const direction = process.argv[2] || 'up';
runMigrations(direction);
