-- Tenant: agendamentos vinculados a pedidos
CREATE TABLE IF NOT EXISTS agendamentos (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  data_evento DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'confirmado'
    CHECK (status IN ('confirmado', 'cancelado')),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data   ON agendamentos(data_evento);
CREATE INDEX IF NOT EXISTS idx_agendamentos_pedido ON agendamentos(pedido_id);
