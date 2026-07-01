-- Tenant: conversas do chat
CREATE TABLE IF NOT EXISTS conversas (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  nome_visitante VARCHAR(100) DEFAULT 'Visitante',
  status VARCHAR(20) NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'encerrada')),
  bot_ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_conversas_session ON conversas(session_id);
CREATE INDEX IF NOT EXISTS idx_conversas_status  ON conversas(status);
