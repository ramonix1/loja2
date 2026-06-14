import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import argon2 from 'argon2';
import pg from 'pg';

const { Pool } = pg;

export const TEST_TENANT_SLUG = 'loja';
export const TEST_ADMIN_EMAIL = 'admin@loja.com';
export const TEST_ADMIN_SENHA = 'admin123';
export const TEST_USER_EMAIL = 'comprador-test@loja.com';
export const TEST_USER_SENHA = 'comprador123';
/** Pedido de teste criado por `ensureTestPedido` (id estável após seed). */
export let TEST_PEDIDO_ID = 0;
/** Produto de teste para cart/checkout (id estável após seed). */
export let TEST_PRODUTO_ID = 0;
/** Produto com estoque limitado para teste 409. */
export let TEST_PRODUTO_ESTOQUE_ID = 0;

/**
 * Prepara o banco de testes (idempotente). Cria as tabelas mínimas (master +
 * tenant), registra o tenant `loja` apontando para o MESMO banco de testes
 * (em dev, master e tenant são o mesmo Postgres) e garante o admin de testes.
 *
 * NÃO é destrutivo, exceto por `TRUNCATE tentativas_login` (limpa bloqueios de
 * rate-limit para tornar os testes determinísticos).
 */
export async function seedTestDatabase(): Promise<void> {
  const connectionString =
    process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/lojao';
  const pool = new Pool({ connectionString, ssl: false });

  try {
    await createMasterTables(pool);
    await registerTenant(pool, connectionString);
    await createTenantTables(pool);
    await ensureAdmin(pool);
    await ensureRegularUser(pool);
    await ensureCheckoutFixtures(pool);
    await ensureTestPedido(pool);
    await ensureBillingFixtures(pool);
    await pool.query('TRUNCATE tentativas_login');

    process.env.TEST_PEDIDO_ID = String(TEST_PEDIDO_ID);
    process.env.TEST_PRODUTO_ID = String(TEST_PRODUTO_ID);
    process.env.TEST_PRODUTO_ESTOQUE_ID = String(TEST_PRODUTO_ESTOQUE_ID);

    const fixturePath = join(dirname(fileURLToPath(import.meta.url)), '.fixture-ids.json');
    writeFileSync(
      fixturePath,
      JSON.stringify({
        pedidoId: TEST_PEDIDO_ID,
        produtoId: TEST_PRODUTO_ID,
        produtoEstoqueId: TEST_PRODUTO_ESTOQUE_ID,
      }),
    );
  } finally {
    await pool.end();
  }
}

async function createMasterTables(pool: pg.Pool): Promise<void> {
  await pool.query(`
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
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS sessao (
      sid VARCHAR NOT NULL COLLATE "default",
      sess JSON NOT NULL,
      expire TIMESTAMP(6) NOT NULL,
      CONSTRAINT session_pkey PRIMARY KEY (sid)
    );
    CREATE INDEX IF NOT EXISTS idx_sessao_expire ON sessao(expire);
  `);
}

async function registerTenant(pool: pg.Pool, connectionString: string): Promise<void> {
  const url = new URL(connectionString);
  const host = url.hostname;
  const port = Number.parseInt(url.port, 10) || 5432;
  const dbName = url.pathname.replace(/^\//, '');
  const user = url.username;
  const password = decodeURIComponent(url.password);

  // NÃO sobrescreve os dados de conexão de um tenant já provisionado (ex.: pelo
  // legacy no Docker, onde db_host='db'). Só insere se faltar; garante ativo=true.
  // Em testes o pool do tenant usa DATABASE_URL (ver tenant-db.ts), então o
  // db_host gravado aqui é irrelevante para a conexão.
  await pool.query(
    `INSERT INTO tenants (slug, nome, db_host, db_port, db_name, db_user, db_password, ativo)
     VALUES ($1, $2, $3, $4, $5, $6, $7, true)
     ON CONFLICT (slug) DO NOTHING`,
    [TEST_TENANT_SLUG, 'Lojão', host, port, dbName, user, password],
  );
  await pool.query('UPDATE tenants SET ativo = true WHERE slug = $1', [TEST_TENANT_SLUG]);
}

async function createTenantTables(pool: pg.Pool): Promise<void> {
  await pool.query(`
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
    CREATE TABLE IF NOT EXISTS tentativas_login (
      id SERIAL PRIMARY KEY,
      ip VARCHAR(45) NOT NULL UNIQUE,
      email VARCHAR(255),
      tentativas INTEGER DEFAULT 0,
      bloqueado_ate TIMESTAMP,
      updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS configuracoes (
      chave VARCHAR(100) PRIMARY KEY,
      valor TEXT,
      updated_at TIMESTAMP DEFAULT NOW()
    );
    INSERT INTO configuracoes (chave, valor) VALUES
      ('loja_nome', 'Lojão'),
      ('loja_slogan', ''),
      ('loja_logo', ''),
      ('loja_cor_primaria', '#2563eb'),
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
      ('frete_comprimento', '17')
    ON CONFLICT (chave) DO NOTHING;
  `);

  // Tabelas mínimas para as queries admin da Fase 2 (dashboard/pedidos).
  // CREATE IF NOT EXISTS é não-destrutivo: no dev real, o legacy já as criou
  // com mais colunas; aqui só garante existência para os testes na CI/host.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categorias (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      ordem INTEGER DEFAULT 0,
      ativo BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
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
    CREATE TABLE IF NOT EXISTS pedidos (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER,
      status VARCHAR(40) DEFAULT 'aguardando_pagamento',
      subtotal NUMERIC(10,2) DEFAULT 0,
      total NUMERIC(10,2) DEFAULT 0,
      frete NUMERIC(10,2) DEFAULT 0,
      metodo_pagamento VARCHAR(20),
      nome_entrega VARCHAR(255),
      email_entrega VARCHAR(255),
      telefone_entrega VARCHAR(20),
      cidade VARCHAR(100),
      estado VARCHAR(2),
      codigo_rastreio VARCHAR(100),
      frete_servico VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS pedido_itens (
      id SERIAL PRIMARY KEY,
      pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
      produto_id INTEGER REFERENCES produtos(id) ON DELETE SET NULL,
      nome_produto VARCHAR(255) NOT NULL,
      quantidade INTEGER NOT NULL DEFAULT 1,
      preco_unitario NUMERIC(10,2) NOT NULL DEFAULT 0,
      subtotal NUMERIC(10,2) NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS pagamentos (
      id SERIAL PRIMARY KEY,
      pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
      mp_payment_id VARCHAR(100),
      status VARCHAR(20) NOT NULL DEFAULT 'pendente',
      status_mp VARCHAR(30),
      valor NUMERIC(10,2),
      metodo VARCHAR(20),
      resposta_json TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS agendamentos (
      id SERIAL PRIMARY KEY,
      pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
      data_evento DATE NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'confirmado',
      created_at TIMESTAMP DEFAULT NOW()
    );
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
    CREATE TABLE IF NOT EXISTS mensagens (
      id SERIAL PRIMARY KEY,
      conversa_id INTEGER NOT NULL REFERENCES conversas(id) ON DELETE CASCADE,
      remetente VARCHAR(10) NOT NULL CHECK (remetente IN ('cliente', 'bot', 'admin')),
      conteudo TEXT NOT NULL,
      lida BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS bot_respostas (
      id SERIAL PRIMARY KEY,
      palavra_chave VARCHAR(200) NOT NULL,
      resposta TEXT NOT NULL,
      ordem INTEGER DEFAULT 0,
      ativo BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS carrinho_itens (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
      quantidade INTEGER NOT NULL DEFAULT 1,
      preco_unitario NUMERIC(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(usuario_id, produto_id)
    );
    CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
      id SERIAL PRIMARY KEY,
      produto_id INTEGER REFERENCES produtos(id) ON DELETE SET NULL,
      tipo VARCHAR(10) NOT NULL,
      quantidade INTEGER NOT NULL,
      origem VARCHAR(20),
      origem_id INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS webhook_events (
      id SERIAL PRIMARY KEY,
      provider VARCHAR(20) NOT NULL,
      event_id VARCHAR(255) NOT NULL,
      event_type VARCHAR(100),
      processed_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(provider, event_id)
    );
  `);
}

async function ensureAdmin(pool: pg.Pool): Promise<void> {
  const existing = await pool.query('SELECT id FROM usuarios WHERE email = $1', [
    TEST_ADMIN_EMAIL,
  ]);
  if (existing.rows.length > 0) {
    // Garante senha/estado conhecidos mesmo se já existir.
    const senhaHash = await argon2.hash(TEST_ADMIN_SENHA, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });
    await pool.query(
      `UPDATE usuarios
       SET senha_hash = $1, role = 'admin', ativo = true,
           tentativas_falha = 0, bloqueado_ate = NULL
       WHERE email = $2`,
      [senhaHash, TEST_ADMIN_EMAIL],
    );
    return;
  }

  const senhaHash = await argon2.hash(TEST_ADMIN_SENHA, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
  await pool.query(
    "INSERT INTO usuarios (nome, email, senha_hash, role) VALUES ($1, $2, $3, 'admin')",
    ['Administrador', TEST_ADMIN_EMAIL, senhaHash],
  );
}

/** Garante um usuário comum (role `usuario`) para testar 403 nas rotas admin. */
async function ensureRegularUser(pool: pg.Pool): Promise<void> {
  const senhaHash = await argon2.hash(TEST_USER_SENHA, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  await pool.query(
    `INSERT INTO usuarios (nome, email, senha_hash, role)
     VALUES ($1, $2, $3, 'usuario')
     ON CONFLICT (email) DO UPDATE
       SET senha_hash = EXCLUDED.senha_hash, role = 'usuario', ativo = true,
           tentativas_falha = 0, bloqueado_ate = NULL`,
    ['Comprador Teste', TEST_USER_EMAIL, senhaHash],
  );
}

/** Garante um pedido com itens para testes de detalhe/PATCH admin. */
async function ensureTestPedido(pool: pg.Pool): Promise<void> {
  await pool.query(`
    ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cpf_entrega VARCHAR(14);
    ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cep VARCHAR(9);
    ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS logradouro VARCHAR(255);
    ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS numero VARCHAR(20);
    ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS complemento VARCHAR(100);
    ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS bairro VARCHAR(100);
    ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS valor NUMERIC(10,2);
    ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS resposta_json TEXT;
  `);

  const userRes = await pool.query<{ id: number }>(
    'SELECT id FROM usuarios WHERE email = $1',
    [TEST_USER_EMAIL],
  );
  const userId = userRes.rows[0]?.id;
  if (!userId) return;

  const existing = await pool.query<{ id: number }>(
    'SELECT id FROM pedidos WHERE usuario_id = $1 ORDER BY id LIMIT 1',
    [userId],
  );
  if (existing.rows[0]) {
    TEST_PEDIDO_ID = existing.rows[0].id;
    return;
  }

  const pedidoRes = await pool.query<{ id: number }>(
    `INSERT INTO pedidos (
       usuario_id, status, subtotal, frete, total, metodo_pagamento,
       nome_entrega, email_entrega, telefone_entrega, cpf_entrega,
       cep, logradouro, numero, complemento, bairro, cidade, estado
     ) VALUES (
       $1, 'pago', 50, 10, 60, 'pix',
       'Comprador Teste', $2, '11999999999', '12345678901',
       '01310100', 'Av Paulista', '1000', 'Apto 1', 'Bela Vista', 'São Paulo', 'SP'
     ) RETURNING id`,
    [userId, TEST_USER_EMAIL],
  );
  const pedidoId = pedidoRes.rows[0]?.id;
  if (!pedidoId) return;
  TEST_PEDIDO_ID = pedidoId;

  await pool.query(
    `INSERT INTO pedido_itens (pedido_id, nome_produto, quantidade, preco_unitario, subtotal)
     VALUES ($1, 'Produto Teste', 2, 25, 50)`,
    [pedidoId],
  );

  await pool.query(
    `INSERT INTO pagamentos (pedido_id, mp_payment_id, status, status_mp, metodo, valor)
     VALUES ($1, 'mp-test-1', 'approved', 'approved', 'pix', 60)`,
    [pedidoId],
  );
}

/** Produtos e bot para testes de cart/checkout/chat. */
async function ensureCheckoutFixtures(pool: pg.Pool): Promise<void> {
  await pool.query(`
    ALTER TABLE produtos ADD COLUMN IF NOT EXISTS estoque INTEGER DEFAULT NULL;
    ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS mp_payment_id VARCHAR(100);
    ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS data_evento DATE;
    ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS valor NUMERIC(10,2);
    ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS resposta_json TEXT;
  `);

  const existingProd = await pool.query<{ id: number }>(
    "SELECT id FROM produtos WHERE nome = 'Produto Checkout Teste' LIMIT 1",
  );
  if (existingProd.rows[0]) {
    TEST_PRODUTO_ID = existingProd.rows[0].id;
  } else {
    const prodRes = await pool.query<{ id: number }>(
      `INSERT INTO produtos (nome, valor, estoque) VALUES ('Produto Checkout Teste', 29.90, 100) RETURNING id`,
    );
    if (prodRes.rows[0]) TEST_PRODUTO_ID = prodRes.rows[0].id;
  }

  const existingEstoque = await pool.query<{ id: number }>(
    "SELECT id FROM produtos WHERE nome = 'Produto Estoque Limitado' LIMIT 1",
  );
  if (existingEstoque.rows[0]) {
    TEST_PRODUTO_ESTOQUE_ID = existingEstoque.rows[0].id;
    await pool.query('UPDATE produtos SET estoque = 1 WHERE id = $1', [existingEstoque.rows[0].id]);
  } else {
    const estoqueRes = await pool.query<{ id: number }>(
      `INSERT INTO produtos (nome, valor, estoque) VALUES ('Produto Estoque Limitado', 10.00, 1) RETURNING id`,
    );
    if (estoqueRes.rows[0]) TEST_PRODUTO_ESTOQUE_ID = estoqueRes.rows[0].id;
  }

  const botExists = await pool.query(`SELECT id FROM bot_respostas WHERE palavra_chave LIKE '%olá%' LIMIT 1`);
  if (!botExists.rows[0]) {
    await pool.query(
      `INSERT INTO bot_respostas (palavra_chave, resposta) VALUES ('olá, oi', 'Olá! Como posso ajudar?')`,
    );
  }

  await pool.query(
    `UPDATE configuracoes SET valor = 'true' WHERE chave = 'controla_estoque'`,
  );
}

/** Billing master tables + plano com comissão para testes Fase 4. */
async function ensureBillingFixtures(pool: pg.Pool): Promise<void> {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
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
      next_billing_date TIMESTAMP,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(tenant_id)
    );
    CREATE TABLE IF NOT EXISTS commission_transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      invoice_id UUID,
      pedido_id INTEGER,
      order_total DECIMAL(10, 2) NOT NULL,
      commission_percentage DECIMAL(5, 2) NOT NULL,
      commission_amount DECIMAL(10, 2) NOT NULL,
      month_year VARCHAR(7) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  const tenantRes = await pool.query<{ id: number }>('SELECT id FROM tenants WHERE slug = $1', [
    TEST_TENANT_SLUG,
  ]);
  const tenantId = tenantRes.rows[0]?.id;
  if (!tenantId) return;

  await pool.query(
    `INSERT INTO billing_plans (name, slug, billing_type, price, commission_percentage)
     VALUES ('Test Revenue', 'test-revenue', 'revenue_share', NULL, 5.00)
     ON CONFLICT (slug) DO NOTHING`,
  );

  const planRes = await pool.query<{ id: string }>(
    `SELECT id FROM billing_plans WHERE slug = 'test-revenue'`,
  );
  const planId = planRes.rows[0]?.id;
  if (!planId) return;

  await pool.query(
    `INSERT INTO tenant_billing (tenant_id, plan_id, billing_type, commission_percentage, status)
     VALUES ($1, $2, 'revenue_share', 5.00, 'active')
     ON CONFLICT (tenant_id) DO UPDATE SET plan_id = $2, commission_percentage = 5.00, status = 'active'`,
    [tenantId, planId],
  );
}
