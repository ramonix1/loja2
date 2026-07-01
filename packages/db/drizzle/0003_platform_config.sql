-- Master: configurações globais da plataforma
CREATE TABLE IF NOT EXISTS platform_config (
  chave VARCHAR(100) PRIMARY KEY,
  valor TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);
INSERT INTO platform_config (chave, valor) VALUES
  ('asaas_api_key',             ''),
  ('asaas_env',                 'sandbox'),
  ('asaas_default_fee_percent', '1.50'),
  ('asaas_webhook_token',       '')
ON CONFLICT (chave) DO NOTHING;
