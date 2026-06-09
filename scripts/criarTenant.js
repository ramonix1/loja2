/**
 * Cria um novo tenant (cliente white-label).
 *
 * Uso:
 *   node scripts/criarTenant.js \
 *     --slug=sapataria-mario \
 *     --nome="Sapataria do MÃ¡rio" \
 *     --admin-email=admin@sapataria.com \
 *     --admin-senha=Senha@123
 */
require('dotenv').config();

const { Pool } = require('pg');
const masterDb = require('../config/masterDb');
const { initializeTenant } = require('../config/tenantSchema');

function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach((arg) => {
    const [key, val] = arg.replace('--', '').split('=');
    args[key] = val;
  });
  return args;
}

async function criarTenant({ slug, nome, adminEmail, adminSenha, adminNome }) {
  if (!slug || !nome || !adminEmail || !adminSenha) {
    console.error('[ERRO]  Uso: node scripts/criarTenant.js --slug=X --nome="Y" --admin-email=Z --admin-senha=W');
    process.exit(1);
  }

  const dbName = `lojao_${slug.replace(/-/g, '_')}`;
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = parseInt(process.env.DB_PORT || '5432');
  const dbUser = process.env.DB_USER || 'postgres';
  const dbPassword = process.env.DB_PASSWORD || '123456';

  console.log(`\n Criando tenant: ${nome} (${slug})`);
  console.log(`   Banco de dados: ${dbName}`);

  // 1. Criar o banco de dados
  const adminPool = new Pool({
    host: dbHost, port: dbPort, user: dbUser, password: dbPassword,
    database: 'postgres', // conecta no postgres para criar o novo banco
  });

  try {
    await adminPool.query(`CREATE DATABASE "${dbName}"`);
    console.log(`[OK] Banco "${dbName}" criado`);
  } catch (err) {
    if (err.code === '42P04') {
      console.log(`  Banco "${dbName}" jÃ¡ existe, continuando...`);
    } else {
      throw err;
    }
  } finally {
    await adminPool.end();
  }

  // 2. Criar schema no novo banco
  const tenantPool = new Pool({
    host: dbHost, port: dbPort, user: dbUser, password: dbPassword, database: dbName,
  });

  try {
    await initializeTenant(tenantPool, adminEmail, adminSenha, adminNome || 'Administrador');
    console.log(`[OK] Schema e admin criados em "${dbName}"`);
  } finally {
    await tenantPool.end();
  }

  // 3. Registrar no banco master
  await masterDb.query(`
    INSERT INTO tenants (slug, nome, db_host, db_port, db_name, db_user, db_password)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (slug) DO UPDATE SET nome = $2, ativo = true
  `, [slug, nome, dbHost, dbPort, dbName, dbUser, dbPassword]);

  console.log(`[OK] Tenant registrado no banco master`);
  console.log(`\n Tenant "${nome}" criado com sucesso!`);
  console.log(`   Slug:  ${slug}`);
  console.log(`   Login: ${adminEmail} / ${adminSenha}`);
  console.log(`   Para testar localmente, use o header: X-Tenant-Slug: ${slug}\n`);
}

const args = parseArgs();
criarTenant({
  slug:       args['slug'],
  nome:       args['nome'],
  adminEmail: args['admin-email'],
  adminSenha: args['admin-senha'],
  adminNome:  args['admin-nome'],
}).then(() => process.exit(0)).catch((err) => {
  console.error('[ERRO] Erro:', err.message);
  process.exit(1);
});
