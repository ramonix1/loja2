const masterDb = require('./masterDb');

async function initializeDatabase() {
  try {
    // Tabela de tenants (catálogo de clientes)
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
  } catch (err) {
    console.error('⚠️  Erro ao inicializar banco master:', err.message);
  }
}

module.exports = initializeDatabase;
