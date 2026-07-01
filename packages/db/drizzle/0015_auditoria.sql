-- Tenant: trilha de auditoria
CREATE TABLE IF NOT EXISTS auditoria (
  id SERIAL PRIMARY KEY,
  tabela VARCHAR(100) NOT NULL,
  registro_id INTEGER,
  acao VARCHAR(10) NOT NULL,
  dados_antigos JSONB,
  dados_novos JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_auditoria_tabela      ON auditoria(tabela);
CREATE INDEX IF NOT EXISTS idx_auditoria_created_at  ON auditoria(created_at DESC);
