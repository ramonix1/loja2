/**
 * Migra√ß√£o: adiciona suporte a controle de estoque em tenants existentes.
 * Uso: node scripts/migrarEstoque.js --slug=nome-do-tenant
 *      node scripts/migrarEstoque.js --all   (todos os tenants ativos)
 */
require('dotenv').config();

const masterDb = require('../config/masterDb');
const { getPool } = require('../config/tenantDb');

function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach(arg => {
    const [key, val] = arg.replace('--', '').split('=');
    args[key] = val ?? true;
  });
  return args;
}

async function migrarTenant(slug) {
  console.log(`\nß Migrando tenant "${slug}"...`);
  const pool = await getPool(slug);

  await pool.query(`ALTER TABLE produtos ADD COLUMN IF NOT EXISTS estoque INTEGER DEFAULT NULL`);
  console.log('   Coluna estoque adicionada (ou j√° existia)');

  await pool.query(`
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
  `);
  console.log('   Tabela movimentacoes_estoque criada (ou j√° existia)');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS configuracoes (
      chave VARCHAR(100) PRIMARY KEY,
      valor TEXT,
      updated_at TIMESTAMP DEFAULT NOW()
    );
    INSERT INTO configuracoes (chave, valor) VALUES
      ('controla_estoque', 'false'),
      ('reservar_estoque_carrinho', 'false')
    ON CONFLICT (chave) DO NOTHING;
  `);
  console.log('   Tabela configuracoes criada com defaults (ou j√° existia)');

  console.log(`   Tenant "${slug}" migrado com sucesso.`);
}

async function main() {
  const args = parseArgs();

  if (args.all) {
    const r = await masterDb.query('SELECT slug FROM tenants WHERE ativo = true ORDER BY slug');
    for (const row of r.rows) {
      await migrarTenant(row.slug);
    }
    console.log(`\nâ Todos os tenants migrados!\n`);
  } else if (args.slug) {
    await migrarTenant(args.slug);
    console.log(`\nâ Pronto!\n`);
  } else {
    console.error('[ERRO] Use --slug=<slug> ou --all');
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => { console.error('[ERRO] Erro:', err.message); process.exit(1); });
