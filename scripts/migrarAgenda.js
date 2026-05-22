/**
 * Migração: adiciona módulo de agenda/buffet em tenants existentes.
 * Uso: node scripts/migrarAgenda.js --slug=nome-do-tenant
 *      node scripts/migrarAgenda.js --all
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
  console.log(`\n🔧 Migrando tenant "${slug}"...`);
  const pool = await getPool(slug);

  await pool.query(`ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS data_evento DATE`);
  console.log('   ✅ Coluna data_evento em pedidos (ou já existia)');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS agenda_config (
      id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      capacidade_diaria INTEGER NOT NULL DEFAULT 1,
      antecedencia_minima_dias INTEGER NOT NULL DEFAULT 1,
      antecedencia_maxima_dias INTEGER NOT NULL DEFAULT 180,
      updated_at TIMESTAMP DEFAULT NOW()
    );
    INSERT INTO agenda_config (id, capacidade_diaria, antecedencia_minima_dias, antecedencia_maxima_dias)
    VALUES (1, 1, 1, 180) ON CONFLICT (id) DO NOTHING;
  `);
  console.log('   ✅ Tabela agenda_config (ou já existia)');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS agenda_dias_especiais (
      data DATE PRIMARY KEY,
      capacidade INTEGER,
      motivo VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('   ✅ Tabela agenda_dias_especiais (ou já existia)');

  await pool.query(`
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
  `);
  console.log('   ✅ Tabela agendamentos (ou já existia)');

  await pool.query(`
    INSERT INTO configuracoes (chave, valor) VALUES ('modulo_agenda', 'false')
    ON CONFLICT (chave) DO NOTHING;
  `);
  console.log('   ✅ Config modulo_agenda adicionada (ou já existia)');

  console.log(`   ✅ Tenant "${slug}" migrado com sucesso.`);
}

async function main() {
  const args = parseArgs();

  if (args.all) {
    const r = await masterDb.query('SELECT slug FROM tenants WHERE ativo = true ORDER BY slug');
    for (const row of r.rows) {
      await migrarTenant(row.slug);
    }
    console.log(`\n🎉 Todos os tenants migrados!\n`);
  } else if (args.slug) {
    await migrarTenant(args.slug);
    console.log(`\n🎉 Pronto!\n`);
  } else {
    console.error('❌ Use --slug=<slug> ou --all');
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => { console.error('❌ Erro:', err.message); process.exit(1); });
