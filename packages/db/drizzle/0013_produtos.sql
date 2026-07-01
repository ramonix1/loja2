-- Tenant: catálogo de produtos
CREATE TABLE IF NOT EXISTS produtos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  subtitulo VARCHAR(255),
  valor NUMERIC(10,2) NOT NULL DEFAULT 0,
  descricao TEXT,
  estoque INTEGER DEFAULT NULL,
  categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
