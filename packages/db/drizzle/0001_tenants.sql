-- Master: registro de tenants (multi-tenant)
CREATE TABLE IF NOT EXISTS tenants (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(50) NOT NULL UNIQUE,
  nome VARCHAR(100) NOT NULL,
  db_host VARCHAR(100) NOT NULL DEFAULT 'localhost',
  db_port INTEGER NOT NULL DEFAULT 5432,
  db_name VARCHAR(100) NOT NULL,
  db_user VARCHAR(100) NOT NULL,
  db_password VARCHAR(100) NOT NULL,
  plano VARCHAR(20) DEFAULT 'basic',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  gateway_type VARCHAR(20) DEFAULT 'asaas_native',
  asaas_account_id VARCHAR(50),
  asaas_wallet_id VARCHAR(50),
  fee_percent_override NUMERIC(5,2),
  gateway_credentials JSONB DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
