-- Tenant: dias especiais na agenda
CREATE TABLE IF NOT EXISTS agenda_dias_especiais (
  data DATE PRIMARY KEY,
  capacidade INTEGER,
  motivo VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
