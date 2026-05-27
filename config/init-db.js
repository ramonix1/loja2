const masterDb = require('./masterDb');

async function initializeDatabase() {
  try {
    await masterDb.query(`
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
      CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);

      CREATE TABLE IF NOT EXISTS sessao (
        sid VARCHAR NOT NULL COLLATE "default",
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL,
        CONSTRAINT session_pkey PRIMARY KEY (sid)
      );
      CREATE INDEX IF NOT EXISTS idx_sessao_expire ON sessao(expire);
    `);

    console.log('✅ Banco master inicializado (tenants + sessao)');

    // Auto-provisiona tenant quando TENANT_SLUG + DATABASE_URL estão definidos (ex: Render)
    await autoProvisionarTenant();
  } catch (err) {
    console.error('⚠️  Erro ao inicializar banco master:', err.message);
  }
}

async function autoProvisionarTenant() {
  const slug = process.env.TENANT_SLUG;
  const dbUrl = process.env.DATABASE_URL;
  if (!slug || !dbUrl) return;

  const existe = await masterDb.query('SELECT id FROM tenants WHERE slug = $1', [slug]);
  if (existe.rows.length > 0) return;

  let host, port, nome_db, user, password;
  try {
    const url = new URL(dbUrl);
    host     = url.hostname;
    port     = parseInt(url.port) || 5432;
    nome_db  = url.pathname.replace(/^\//, '');
    user     = url.username;
    password = decodeURIComponent(url.password);
  } catch {
    console.error('⚠️  DATABASE_URL inválida para auto-provisionar tenant');
    return;
  }

  await masterDb.query(
    `INSERT INTO tenants (slug, nome, db_host, db_port, db_name, db_user, db_password)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [slug, slug, host, port, nome_db, user, password]
  );
  console.log(`✅ Tenant "${slug}" registrado automaticamente`);

  // Inicializa as tabelas do tenant
  const { getPool } = require('./tenantDb');
  const { initializeTenant } = require('./tenantSchema');
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@loja.com';
  const adminSenha = process.env.ADMIN_SENHA || 'admin123';
  const adminNome  = process.env.ADMIN_NOME  || 'Administrador';
  const pool = await getPool(slug);
  await initializeTenant(pool, adminEmail, adminSenha, adminNome);
  console.log(`✅ Banco do tenant "${slug}" inicializado (admin: ${adminEmail})`);
}

module.exports = initializeDatabase;
