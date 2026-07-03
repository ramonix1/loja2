-- MA7 — Billing por conta merchant (greenfield EN). Convive com `tenant_billing`
-- legado até o cutover MA8; ver docs/specs/merchant-account-architecture-spec.md §8.

CREATE TABLE IF NOT EXISTS merchant_billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES billing_plans(id),
  billing_type VARCHAR(50) NOT NULL,
  monthly_fee DECIMAL(10, 2),
  commission_percentage DECIMAL(5, 2),
  trial_ends_at TIMESTAMP,
  next_billing_date TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active',
  custom_max_stores INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT uq_merchant_billing_merchant_id UNIQUE (merchant_id)
);
CREATE INDEX IF NOT EXISTS idx_merchant_billing_merchant_id ON merchant_billing(merchant_id);

CREATE TABLE IF NOT EXISTS merchant_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
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
CREATE INDEX IF NOT EXISTS idx_merchant_invoices_merchant_id ON merchant_invoices(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_invoices_month_year ON merchant_invoices(month_year);

CREATE TABLE IF NOT EXISTS merchant_commission_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES merchant_invoices(id),
  order_id INTEGER,
  order_total DECIMAL(10, 2) NOT NULL,
  commission_percentage DECIMAL(5, 2) NOT NULL,
  commission_amount DECIMAL(10, 2) NOT NULL,
  month_year VARCHAR(7) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_merchant_commission_merchant_id ON merchant_commission_transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_commission_month_year ON merchant_commission_transactions(month_year);
