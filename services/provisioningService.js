const crypto = require('crypto');
const { Pool } = require('pg');
const masterDb = require('../config/masterDb');
const { initializeTenant } = require('../config/tenantSchema');

// Extrai credenciais de DB_HOST/PORT/USER/PASSWORD se definidos,
// caso contrário parseia DATABASE_URL (padrão em deploys single-server)
function getDbConfig() {
  if (process.env.DB_HOST) {
    return {
      host:     process.env.DB_HOST,
      port:     parseInt(process.env.DB_PORT || '5432'),
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD || '',
    };
  }
  const url = new URL(process.env.DATABASE_URL);
  return {
    host:     url.hostname,
    port:     parseInt(url.port) || 5432,
    user:     url.username,
    password: decodeURIComponent(url.password),
  };
}

async function provisionarTenant(lead) {
  const slug = lead.slug_desejado;
  if (!slug) throw new Error('Lead sem slug_desejado definido');

  const dbConf  = getDbConfig();
  const dbName  = `lojao_${slug.replace(/-/g, '_')}`;
  const senha   = crypto.randomBytes(6).toString('hex');

  // Criar banco de dados
  const adminPool = new Pool({ ...dbConf, database: 'postgres' });
  try {
    await adminPool.query(`CREATE DATABASE "${dbName}"`);
  } catch (err) {
    if (err.code !== '42P04') throw err; // 42P04 = database already exists
  } finally {
    await adminPool.end();
  }

  // Inicializar schema do tenant
  const tenantPool = new Pool({ ...dbConf, database: dbName });
  try {
    await initializeTenant(tenantPool, lead.email, senha, lead.nome_contato);
  } finally {
    await tenantPool.end();
  }

  // Registrar no master
  await masterDb.query(
    `INSERT INTO tenants (slug, nome, db_host, db_port, db_name, db_user, db_password, plano)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (slug) DO UPDATE SET ativo = true`,
    [slug, lead.nome_empresa || slug, dbConf.host, dbConf.port, dbName, dbConf.user, dbConf.password, lead.plano || 'basic']
  );

  await masterDb.query(
    "UPDATE leads SET status = 'ativo', tenant_slug = $1, updated_at = NOW() WHERE id = $2",
    [slug, lead.id]
  );

  // Email de boas-vindas (falha silenciosa para não bloquear o provisioning)
  try {
    const emailService = require('./emailService');
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    await emailService.enviarEmailBoasVindasPlataforma({
      email: lead.email,
      nome: lead.nome_contato,
      empresa: lead.nome_empresa,
      slug,
      senha,
      appUrl,
    });
  } catch (err) {
    console.error('[Provisioning] Falha no email de boas-vindas:', err.message);
  }

  console.log(`[Provisioning] Tenant "${slug}" provisionado — admin: ${lead.email}`);
  return { slug, senha, dbName };
}

module.exports = { provisionarTenant };
