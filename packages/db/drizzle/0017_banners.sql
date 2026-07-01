-- Tenant: banners da vitrine
CREATE TABLE IF NOT EXISTS banners (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  subtitulo VARCHAR(500),
  imagem VARCHAR(500) NOT NULL,
  cta_texto VARCHAR(100) DEFAULT 'Ver oferta',
  cta_url VARCHAR(500),
  produto_id INTEGER REFERENCES produtos(id) ON DELETE SET NULL,
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_banners_ativo  ON banners(ativo);
CREATE INDEX IF NOT EXISTS idx_banners_ordem  ON banners(ordem ASC);
