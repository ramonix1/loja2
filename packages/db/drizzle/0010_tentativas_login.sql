-- Tenant: rate limit de login por IP
CREATE TABLE IF NOT EXISTS tentativas_login (
  id SERIAL PRIMARY KEY,
  ip VARCHAR(45) NOT NULL UNIQUE,
  email VARCHAR(255),
  tentativas INTEGER DEFAULT 0,
  bloqueado_ate TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tentativas_ip ON tentativas_login(ip);
