-- Tenant: movimentações de estoque
CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
  id SERIAL PRIMARY KEY,
  produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'saida', 'ajuste')),
  quantidade INTEGER NOT NULL,
  origem VARCHAR(30),
  origem_id INTEGER,
  observacao TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_movest_produto ON movimentacoes_estoque(produto_id);
