-- Tenant: respostas automáticas do bot
CREATE TABLE IF NOT EXISTS bot_respostas (
  id SERIAL PRIMARY KEY,
  palavra_chave VARCHAR(200) NOT NULL,
  resposta TEXT NOT NULL,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bot_respostas_ativo ON bot_respostas(ativo);
