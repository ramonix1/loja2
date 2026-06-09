require('dotenv').config();
const masterDb = require('../config/masterDb');
const { getPool } = require('../config/tenantDb');

const SQL = `
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
`;

async function run() {
  const r = await masterDb.query(`SELECT slug FROM tenants WHERE ativo = true`);
  for (const row of r.rows) {
    try {
      const pool = await getPool(row.slug);
      await pool.query(SQL);
      console.log(`[OK] ${row.slug}: tabelas de chat criadas`);
    } catch (err) {
      console.error(`${row.slug}: ${err.message}`);
    }
  }
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
