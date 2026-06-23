-- Baseline Lojão — espelha schema legacy (Fase 7). Sem alterações destrutivas.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- Master (init-db.js)
-- =============================================================================

CREATE TABLE IF NOT EXISTS tenants (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(50) NOT NULL UNIQUE,
  nome VARCHAR(100) NOT NULL,
  db_host VARCHAR(100) NOT NULL DEFAULT 'localhost',
  db_port INTEGER NOT NULL DEFAULT 5432,
  db_name VARCHAR(100) NOT NULL,
  db_user VARCHAR(100) NOT NULL,
  db_password VARCHAR(100) NOT NULL,
  plano VARCHAR(20) DEFAULT 'basic',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  gateway_type VARCHAR(20) DEFAULT 'asaas_native',
  asaas_account_id VARCHAR(50),
  asaas_wallet_id VARCHAR(50),
  fee_percent_override NUMERIC(5,2),
  gateway_credentials JSONB DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);

CREATE TABLE IF NOT EXISTS sessao (
  sid VARCHAR NOT NULL COLLATE "default",
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL,
  CONSTRAINT session_pkey PRIMARY KEY (sid)
);
CREATE INDEX IF NOT EXISTS idx_sessao_expire ON sessao(expire);

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

CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  token VARCHAR(64) NOT NULL UNIQUE,
  nome_contato VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  nome_empresa VARCHAR(150),
  cpf_cnpj VARCHAR(18),
  slug_desejado VARCHAR(50),
  plano VARCHAR(20) NOT NULL DEFAULT 'basic',
  status VARCHAR(30) NOT NULL DEFAULT 'novo'
    CHECK (status IN ('novo','em_onboarding','aguardando_pagamento','aguardando_ativacao','ativo','cancelado')),
  consultor_nome VARCHAR(100),
  asaas_customer_id VARCHAR(50),
  asaas_payment_id VARCHAR(50),
  tenant_slug VARCHAR(50),
  termos_aceitos_em TIMESTAMP,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_leads_token  ON leads(token);
CREATE INDEX IF NOT EXISTS idx_leads_email  ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- =============================================================================
-- Billing (migrations-billing.js)
-- =============================================================================

CREATE TABLE IF NOT EXISTS billing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  billing_type VARCHAR(50) NOT NULL,
  commission_percentage DECIMAL(5, 2),
  features TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES billing_plans(id),
  billing_type VARCHAR(50) NOT NULL,
  monthly_fee DECIMAL(10, 2),
  commission_percentage DECIMAL(5, 2),
  trial_ends_at TIMESTAMP,
  next_billing_date TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id)
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  month_year VARCHAR(7) NOT NULL,
  billing_type VARCHAR(50) NOT NULL,
  monthly_fee DECIMAL(10, 2),
  total_sales DECIMAL(15, 2),
  commission_percentage DECIMAL(5, 2),
  commission_amount DECIMAL(10, 2),
  subtotal DECIMAL(10, 2),
  taxes DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'pending',
  issue_date TIMESTAMP DEFAULT NOW(),
  due_date TIMESTAMP,
  paid_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commission_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id),
  pedido_id INTEGER,
  order_total DECIMAL(10, 2) NOT NULL,
  commission_percentage DECIMAL(5, 2) NOT NULL,
  commission_amount DECIMAL(10, 2) NOT NULL,
  month_year VARCHAR(7) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_billing ON tenant_billing(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_month_year ON invoices(month_year);
CREATE INDEX IF NOT EXISTS idx_commission_tenant ON commission_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_commission_month ON commission_transactions(month_year);

-- =============================================================================
-- Tenant (tenantSchema.js)
-- =============================================================================

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'usuario' CHECK (role IN ('usuario', 'admin')),
  telefone VARCHAR(20),
  cpf VARCHAR(14),
  cep VARCHAR(9),
  logradouro VARCHAR(255),
  numero VARCHAR(20),
  complemento VARCHAR(100),
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  estado VARCHAR(2),
  ativo BOOLEAN DEFAULT true,
  tentativas_falha INTEGER DEFAULT 0,
  bloqueado_ate TIMESTAMP,
  ultimo_acesso TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_role  ON usuarios(role);
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_cpf ON usuarios(cpf) WHERE cpf IS NOT NULL;

CREATE TABLE IF NOT EXISTS tentativas_login (
  id SERIAL PRIMARY KEY,
  ip VARCHAR(45) NOT NULL UNIQUE,
  email VARCHAR(255),
  tentativas INTEGER DEFAULT 0,
  bloqueado_ate TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tentativas_ip ON tentativas_login(ip);

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

CREATE TABLE IF NOT EXISTS categorias (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_categorias_ordem ON categorias(ordem ASC);

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

CREATE TABLE IF NOT EXISTS produtos_imagens (
  id SERIAL PRIMARY KEY,
  produto_id INTEGER REFERENCES produtos(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_produtos_imagens_produto_id ON produtos_imagens(produto_id);

CREATE TABLE IF NOT EXISTS auditoria (
  id SERIAL PRIMARY KEY,
  tabela VARCHAR(100) NOT NULL,
  registro_id INTEGER,
  acao VARCHAR(10) NOT NULL,
  dados_antigos JSONB,
  dados_novos JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_auditoria_tabela      ON auditoria(tabela);
CREATE INDEX IF NOT EXISTS idx_auditoria_created_at  ON auditoria(created_at DESC);

CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  logo VARCHAR(500),
  website VARCHAR(255),
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_clientes_ordem ON clientes(ordem ASC);
CREATE INDEX IF NOT EXISTS idx_clientes_ativo ON clientes(ativo);

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

CREATE TABLE IF NOT EXISTS carrinho_itens (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  quantidade INTEGER NOT NULL DEFAULT 1 CHECK (quantidade > 0),
  preco_unitario NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (usuario_id, produto_id)
);
CREATE INDEX IF NOT EXISTS idx_carrinho_usuario ON carrinho_itens(usuario_id);

CREATE TABLE IF NOT EXISTS pedidos (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  nome_entrega VARCHAR(255) NOT NULL,
  email_entrega VARCHAR(255) NOT NULL,
  telefone_entrega VARCHAR(20),
  cpf_entrega VARCHAR(14),
  cep VARCHAR(9),
  logradouro VARCHAR(255),
  numero VARCHAR(20),
  complemento VARCHAR(100),
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  estado VARCHAR(2),
  subtotal NUMERIC(10,2) NOT NULL,
  frete NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'aguardando_pagamento'
    CHECK (status IN ('aguardando_pagamento','pago','em_separacao','enviado','entregue','cancelado')),
  metodo_pagamento VARCHAR(20),
  mp_payment_id VARCHAR(100),
  data_evento DATE,
  codigo_rastreio VARCHAR(100),
  frete_servico VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status  ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_mp      ON pedidos(mp_payment_id);

CREATE TABLE IF NOT EXISTS pedido_itens (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id INTEGER REFERENCES produtos(id) ON DELETE SET NULL,
  nome_produto VARCHAR(255) NOT NULL,
  quantidade INTEGER NOT NULL,
  preco_unitario NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pedido_itens_pedido ON pedido_itens(pedido_id);

CREATE TABLE IF NOT EXISTS pagamentos (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  mp_payment_id VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'pendente',
  status_mp VARCHAR(30),
  valor NUMERIC(10,2) NOT NULL,
  metodo VARCHAR(20),
  resposta_json TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pagamentos_pedido ON pagamentos(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_mp     ON pagamentos(mp_payment_id);

CREATE TABLE IF NOT EXISTS agenda_config (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  capacidade_diaria INTEGER NOT NULL DEFAULT 1,
  antecedencia_minima_dias INTEGER NOT NULL DEFAULT 1,
  antecedencia_maxima_dias INTEGER NOT NULL DEFAULT 180,
  updated_at TIMESTAMP DEFAULT NOW()
);
INSERT INTO agenda_config (id, capacidade_diaria, antecedencia_minima_dias, antecedencia_maxima_dias)
VALUES (1, 1, 1, 180) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS agenda_dias_especiais (
  data DATE PRIMARY KEY,
  capacidade INTEGER,
  motivo VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agendamentos (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  data_evento DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'confirmado'
    CHECK (status IN ('confirmado', 'cancelado')),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data   ON agendamentos(data_evento);
CREATE INDEX IF NOT EXISTS idx_agendamentos_pedido ON agendamentos(pedido_id);

CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
  id SERIAL PRIMARY KEY,
  produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'saida', 'ajuste')),
  quantidade INTEGER NOT NULL,
  origem VARCHAR(30),
  origem_id INTEGER,
  observacao TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_movest_produto ON movimentacoes_estoque(produto_id);

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

CREATE TABLE IF NOT EXISTS mensagens (
  id SERIAL PRIMARY KEY,
  conversa_id INTEGER NOT NULL REFERENCES conversas(id) ON DELETE CASCADE,
  remetente VARCHAR(10) NOT NULL CHECK (remetente IN ('cliente', 'bot', 'admin')),
  conteudo TEXT NOT NULL,
  lida BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mensagens_conversa ON mensagens(conversa_id);

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

-- =============================================================================
-- API (seed.ts — webhook_events)
-- =============================================================================

CREATE TABLE IF NOT EXISTS webhook_events (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(20) NOT NULL,
  event_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(100),
  processed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider, event_id)
);
