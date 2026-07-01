-- Tenant: configuração do módulo de agenda
CREATE TABLE IF NOT EXISTS agenda_config (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  capacidade_diaria INTEGER NOT NULL DEFAULT 1,
  antecedencia_minima_dias INTEGER NOT NULL DEFAULT 1,
  antecedencia_maxima_dias INTEGER NOT NULL DEFAULT 180,
  updated_at TIMESTAMP DEFAULT NOW()
);
INSERT INTO agenda_config (id, capacidade_diaria, antecedencia_minima_dias, antecedencia_maxima_dias)
VALUES (1, 1, 1, 180) ON CONFLICT (id) DO NOTHING;
