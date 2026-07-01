-- Master: sessões Express (connect-pg-simple)
CREATE TABLE IF NOT EXISTS sessao (
  sid VARCHAR NOT NULL COLLATE "default",
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL,
  CONSTRAINT session_pkey PRIMARY KEY (sid)
);
CREATE INDEX IF NOT EXISTS idx_sessao_expire ON sessao(expire);
