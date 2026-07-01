-- Billing: faturas mensais
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  month_year VARCHAR(7) NOT NULL,
  billing_type VARCHAR(50) NOT NULL,
  monthly_fee DECIMAL(10, 2),
  total_sales DECIMAL(15, 2),
  commission_percentage DECIMAL(5, 2),
  commission_amount DECIMAL(10, 2),
  subtotal DECIMAL(10, 2),
  taxes DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'pending',
  issue_date TIMESTAMP DEFAULT NOW(),
  due_date TIMESTAMP,
  paid_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_month_year ON invoices(month_year);
