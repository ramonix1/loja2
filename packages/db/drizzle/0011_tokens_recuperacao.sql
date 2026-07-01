-- Tenant: tokens de recuperação de senha
CREATE TABLE IF NOT EXISTS tokens_recuperacao (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  canal VARCHAR(10) DEFAULT 'email' CHECK (canal IN ('email', 'sms')),
  usado BOOLEAN DEFAULT false,
  expira_em TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tokens_hash    ON tokens_recuperacao(token_hash);
CREATE INDEX IF NOT EXISTS idx_tokens_usuario ON tokens_recuperacao(usuario_id);
