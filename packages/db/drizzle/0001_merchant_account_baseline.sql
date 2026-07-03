-- MA1 — Master schema greenfield (merchant-account). Convive com o schema legado
-- PT (tenants, sessao, …) até o cutover MA8; ver docs/specs/merchant-account-architecture-spec.md
-- e docs/specs/db-schema-english.md. Idempotente (IF NOT EXISTS), sem alterar 0000_baseline.sql.

-- =============================================================================
-- Master EN (merchant-account.ts) — MA1
-- =============================================================================

CREATE TABLE IF NOT EXISTS merchants (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  active BOOLEAN DEFAULT true,
  db_name VARCHAR(100) NOT NULL,
  db_host VARCHAR(100) NOT NULL,
  db_port INTEGER NOT NULL DEFAULT 5432,
  db_user VARCHAR(100) NOT NULL,
  db_password VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stores (
  id SERIAL PRIMARY KEY,
  merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stores_merchant_id ON stores(merchant_id);

CREATE TABLE IF NOT EXISTS merchant_members (
  id SERIAL PRIMARY KEY,
  merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'owner',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT uq_merchant_members_merchant_email UNIQUE (merchant_id, email)
);
CREATE INDEX IF NOT EXISTS idx_merchant_members_merchant_id ON merchant_members(merchant_id);
