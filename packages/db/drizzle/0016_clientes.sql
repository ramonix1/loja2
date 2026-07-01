-- Tenant: logos de clientes (social proof)
CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  logo VARCHAR(500),
  website VARCHAR(255),
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_clientes_ordem ON clientes(ordem ASC);
CREATE INDEX IF NOT EXISTS idx_clientes_ativo ON clientes(ativo);
