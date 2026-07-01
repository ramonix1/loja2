-- Tenant: imagens dos produtos
CREATE TABLE IF NOT EXISTS produtos_imagens (
  id SERIAL PRIMARY KEY,
  produto_id INTEGER REFERENCES produtos(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_produtos_imagens_produto_id ON produtos_imagens(produto_id);
