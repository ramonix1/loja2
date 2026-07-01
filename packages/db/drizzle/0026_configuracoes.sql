-- Tenant: configurações da loja (key-value)
CREATE TABLE IF NOT EXISTS configuracoes (
  chave VARCHAR(100) PRIMARY KEY,
  valor TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);
INSERT INTO configuracoes (chave, valor) VALUES
  ('controla_estoque', 'false'),
  ('reservar_estoque_carrinho', 'false'),
  ('modulo_agenda', 'false'),
  ('habilitar_sumup', 'false'),
  ('frete_cep_origem', ''),
  ('frete_fixo', '0'),
  ('frete_gratis_acima', '0'),
  ('melhor_envio_token', ''),
  ('melhor_envio_sandbox', 'true'),
  ('frete_peso_padrao', '300'),
  ('frete_altura', '4'),
  ('frete_largura', '12'),
  ('frete_comprimento', '17'),
  ('loja_nome', 'Lojão'),
  ('loja_slogan', ''),
  ('loja_logo', ''),
  ('loja_favicon', ''),
  ('loja_cor_primaria', '#0D5FE0'),
  ('loja_rodape', ''),
  ('loja_email', ''),
  ('loja_whatsapp', '')
ON CONFLICT (chave) DO NOTHING;
