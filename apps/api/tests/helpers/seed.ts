import argon2 from 'argon2';
import pg from 'pg';

const { Pool } = pg;

export const TEST_TENANT_SLUG = 'loja';
export const TEST_ADMIN_EMAIL = 'admin@loja.com';
export const TEST_ADMIN_SENHA = 'admin123';
export const TEST_USER_EMAIL = 'comprador-test@loja.com';
export const TEST_USER_SENHA = 'comprador123';

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
    await pool.query('TRUNCATE tentativas_login');
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
      ('loja_cor_primaria', '#2563eb')
    ON CONFLICT (chave) DO NOTHING;
  `);

  // Tabelas mínimas para as queries admin da Fase 2 (dashboard/pedidos).
  // CREATE IF NOT EXISTS é não-destrutivo: no dev real, o legacy já as criou
  // com mais colunas; aqui só garante existência para os testes na CI/host.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS produtos (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS pedidos (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER,
      status VARCHAR(40) DEFAULT 'aguardando_pagamento',
      total NUMERIC(10,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
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
