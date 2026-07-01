-- Tenant: pagamentos (Mercado Pago / gateways)
CREATE TABLE IF NOT EXISTS pagamentos (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  mp_payment_id VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'pendente',
  status_mp VARCHAR(30),
  valor NUMERIC(10,2) NOT NULL,
  metodo VARCHAR(20),
  resposta_json TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pagamentos_pedido ON pagamentos(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_mp     ON pagamentos(mp_payment_id);
