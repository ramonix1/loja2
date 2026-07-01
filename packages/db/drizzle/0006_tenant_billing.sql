-- Billing: assinatura por tenant
CREATE TABLE IF NOT EXISTS tenant_billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES billing_plans(id),
  billing_type VARCHAR(50) NOT NULL,
  monthly_fee DECIMAL(10, 2),
  commission_percentage DECIMAL(5, 2),
  trial_ends_at TIMESTAMP,
  next_billing_date TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id)
);
CREATE INDEX IF NOT EXISTS idx_tenant_billing ON tenant_billing(tenant_id);
