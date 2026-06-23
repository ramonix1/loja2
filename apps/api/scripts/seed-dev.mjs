/**
 * Seed de desenvolvimento — dados demo para o tenant padrão (slug `loja`).
 *
 * Uso:
 *   pnpm --filter api seed:dev
 *   pnpm --filter api seed:fresh
 *   make seed / make seed-fresh
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { runMigrations } from '@lojao/db';
import argon2 from 'argon2';
import pg from 'pg';

/** Cor primária padrão Ata Commerce — alinhada ao manual PDF. */
const DEFAULT_LOJA_COR_PRIMARIA = '#0D5FE0';
const DEFAULT_LOJA_COR_HEX = '0D5FE0';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '../../../.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim();
  }
}

const { Pool } = pg;
const connectionString =
  process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/lojao';
const masterPool = new Pool({ connectionString, ssl: false });
const masterDb = { query: (text, params) => masterPool.query(text, params) };

let tenantPool;
async function getPool() {
  if (!tenantPool) tenantPool = new Pool({ connectionString, ssl: false });
  return tenantPool;
}

async function initializeTenant(pool, adminEmail, adminSenha, adminNome = 'Administrador') {
  const adminExiste = await pool.query("SELECT id FROM usuarios WHERE role = 'admin' LIMIT 1");
  if (adminExiste.rows.length === 0) {
    const senhaHash = await argon2.hash(adminSenha, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });
    await pool.query(
      "INSERT INTO usuarios (nome, email, senha_hash, role) VALUES ($1, $2, $3, 'admin')",
      [adminNome, adminEmail, senhaHash],
    );
  }
}

const DEV_PREFIX = '[DEV]';
const SLUG = process.env.TENANT_SLUG || 'loja';

const ADMIN = {
  nome: process.env.ADMIN_NOME || 'Administrador',
  email: process.env.ADMIN_EMAIL || 'admin@loja.com',
  senha: process.env.ADMIN_SENHA || 'admin123',
};

const COMPRADORES = [
  {
    nome: 'Comprador Teste',
    email: 'comprador-test@loja.com',
    senha: 'comprador123',
    telefone: '11999990001',
    cpf: '529.982.247-25',
    cep: '01310-100',
    logradouro: 'Av. Paulista',
    numero: '1000',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    estado: 'SP',
  },
  {
    nome: 'Maria Silva',
    email: 'maria.silva@email.com',
    senha: 'comprador123',
    telefone: '11999990002',
    cpf: '390.533.447-05',
    cep: '22041-080',
    logradouro: 'Rua Barão de Mesquita',
    numero: '42',
    bairro: 'Tijuca',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
  },
  {
    nome: 'João Santos',
    email: 'joao.santos@email.com',
    senha: 'comprador123',
    telefone: '11999990003',
    cpf: '153.509.460-56',
    cep: '30130-010',
    logradouro: 'Av. Afonso Pena',
    numero: '500',
    bairro: 'Centro',
    cidade: 'Belo Horizonte',
    estado: 'MG',
  },
];

const CATEGORIAS = [
  { nome: `${DEV_PREFIX} Eletrônicos`, ordem: 1 },
  { nome: `${DEV_PREFIX} Casa`, ordem: 2 },
  { nome: `${DEV_PREFIX} Acessórios`, ordem: 3 },
];

const PRODUTOS = [
  { cat: 0, nome: `${DEV_PREFIX} Fone Bluetooth Pro`, subtitulo: 'Cancelamento de ruído', valor: 249.9, estoque: 50 },
  { cat: 0, nome: `${DEV_PREFIX} Smartwatch Fit`, subtitulo: 'Monitor cardíaco', valor: 399.0, estoque: 30 },
  { cat: 0, nome: `${DEV_PREFIX} Caixa de Som 20W`, subtitulo: 'IPX5 à prova d\'água', valor: 189.9, estoque: 0 },
  { cat: 1, nome: `${DEV_PREFIX} Kit Panelas Antiaderente`, subtitulo: '5 peças', valor: 299.0, estoque: 25 },
  { cat: 1, nome: `${DEV_PREFIX} Luminária LED Mesa`, subtitulo: 'Tom ajustável', valor: 89.9, estoque: 40 },
  { cat: 2, nome: `${DEV_PREFIX} Mochila Urban 30L`, subtitulo: 'Compartimento notebook', valor: 159.9, estoque: 15 },
  { cat: 2, nome: `${DEV_PREFIX} Garrafa Térmica 750ml`, subtitulo: '24h quente/fria', valor: 79.9, estoque: 100 },
  { cat: 2, nome: `${DEV_PREFIX} Capa Celular Premium`, subtitulo: 'Silicone reforçado', valor: 49.9, estoque: 200 },
];

function parseArgs() {
  return { fresh: process.argv.includes('--fresh') };
}

async function hashSenha(senha) {
  return argon2.hash(senha, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
}

async function ensureTenantRegistered() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL não definida');

  const url = new URL(dbUrl);
  await masterDb.query(
    `INSERT INTO tenants (slug, nome, db_host, db_port, db_name, db_user, db_password, ativo)
     VALUES ($1, $2, $3, $4, $5, $6, $7, true)
     ON CONFLICT (slug) DO UPDATE SET
       ativo = true,
       db_host = EXCLUDED.db_host,
       db_port = EXCLUDED.db_port,
       db_name = EXCLUDED.db_name,
       db_user = EXCLUDED.db_user,
       db_password = EXCLUDED.db_password`,
    [
      SLUG,
      'Ata Commerce Dev',
      url.hostname,
      parseInt(url.port, 10) || 5432,
      url.pathname.replace(/^\//, ''),
      url.username,
      decodeURIComponent(url.password),
    ],
  );
}

async function upsertUsuario(pool, user, role = 'usuario') {
  const senhaHash = await hashSenha(user.senha);
  const r = await pool.query(
    `INSERT INTO usuarios (
       nome, email, senha_hash, role, telefone, cpf, cep, logradouro, numero, bairro, cidade, estado, ativo
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,true)
     ON CONFLICT (email) DO UPDATE SET
       nome = EXCLUDED.nome,
       senha_hash = EXCLUDED.senha_hash,
       role = EXCLUDED.role,
       telefone = EXCLUDED.telefone,
       cpf = EXCLUDED.cpf,
       cep = EXCLUDED.cep,
       logradouro = EXCLUDED.logradouro,
       numero = EXCLUDED.numero,
       bairro = EXCLUDED.bairro,
       cidade = EXCLUDED.cidade,
       estado = EXCLUDED.estado,
       ativo = true,
       tentativas_falha = 0,
       bloqueado_ate = NULL
     RETURNING id`,
    [
      user.nome,
      user.email.toLowerCase(),
      senhaHash,
      role,
      user.telefone || null,
      user.cpf || null,
      user.cep || null,
      user.logradouro || null,
      user.numero || null,
      user.bairro || null,
      user.cidade || null,
      user.estado || null,
    ],
  );
  return r.rows[0].id;
}

async function clearDevData(pool) {
  console.log('  Removendo dados anteriores [DEV]...');
  await pool.query(`
    DELETE FROM pagamentos WHERE pedido_id IN (
      SELECT p.id FROM pedidos p
      JOIN usuarios u ON u.id = p.usuario_id
      WHERE u.email = ANY($1)
    );
  `, [COMPRADORES.map((c) => c.email)]);

  await pool.query(`
    DELETE FROM pedido_itens WHERE pedido_id IN (
      SELECT p.id FROM pedidos p
      JOIN usuarios u ON u.id = p.usuario_id
      WHERE u.email = ANY($1)
    );
  `, [COMPRADORES.map((c) => c.email)]);

  await pool.query(`
    DELETE FROM agendamentos WHERE pedido_id IN (
      SELECT p.id FROM pedidos p
      JOIN usuarios u ON u.id = p.usuario_id
      WHERE u.email = ANY($1)
    );
  `, [COMPRADORES.map((c) => c.email)]);

  await pool.query(`
    DELETE FROM pedidos WHERE usuario_id IN (
      SELECT id FROM usuarios WHERE email = ANY($1)
    );
  `, [COMPRADORES.map((c) => c.email)]);

  await pool.query(`
    DELETE FROM carrinho_itens WHERE usuario_id IN (
      SELECT id FROM usuarios WHERE email = ANY($1)
    );
  `, [COMPRADORES.map((c) => c.email)]);

  await pool.query(`DELETE FROM produtos_imagens WHERE produto_id IN (
    SELECT id FROM produtos WHERE nome LIKE $1
  )`, [`${DEV_PREFIX}%`]);

  await pool.query(`DELETE FROM produtos WHERE nome LIKE $1`, [`${DEV_PREFIX}%`]);
  await pool.query(`DELETE FROM categorias WHERE nome LIKE $1`, [`${DEV_PREFIX}%`]);
  await pool.query(`DELETE FROM banners WHERE titulo LIKE $1`, [`${DEV_PREFIX}%`]);
  await pool.query(`DELETE FROM clientes WHERE nome LIKE $1`, [`${DEV_PREFIX}%`]);
}

async function seedCategorias(pool) {
  const ids = [];
  for (const cat of CATEGORIAS) {
    const existing = await pool.query(
      'SELECT id FROM categorias WHERE nome = $1',
      [cat.nome],
    );
    if (existing.rows[0]) {
      ids.push(existing.rows[0].id);
      continue;
    }
    const r = await pool.query(
      'INSERT INTO categorias (nome, ordem, ativo) VALUES ($1, $2, true) RETURNING id',
      [cat.nome, cat.ordem],
    );
    ids.push(r.rows[0].id);
  }
  return ids;
}

async function seedProdutos(pool, categoriaIds) {
  const produtoIds = [];
  for (const p of PRODUTOS) {
    let id;
    const existing = await pool.query('SELECT id FROM produtos WHERE nome = $1', [p.nome]);
    if (existing.rows[0]) {
      id = existing.rows[0].id;
      await pool.query(
        'UPDATE produtos SET valor = $1, estoque = $2, categoria_id = $3 WHERE id = $4',
        [p.valor, p.estoque, categoriaIds[p.cat], id],
      );
    } else {
      const r = await pool.query(
        `INSERT INTO produtos (nome, subtitulo, valor, descricao, estoque, categoria_id)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [p.nome, p.subtitulo, p.valor, `Produto de demonstração — ${p.subtitulo}`, p.estoque, categoriaIds[p.cat]],
      );
      id = r.rows[0].id;
    }
    produtoIds.push(id);

    const imgExists = await pool.query(
      'SELECT id FROM produtos_imagens WHERE produto_id = $1 LIMIT 1',
      [id],
    );
    if (!imgExists.rows[0]) {
      await pool.query(
        'INSERT INTO produtos_imagens (produto_id, url) VALUES ($1, $2)',
        [id, `https://placehold.co/600x600/${DEFAULT_LOJA_COR_HEX}/white?text=Produto+${id}`],
      );
    }
  }
  return produtoIds;
}

async function criarPedido(pool, { usuarioId, comprador, status, metodo, itens, extras = {} }) {
  const subtotal = itens.reduce((s, i) => s + i.preco * i.qtd, 0);
  const frete = extras.frete ?? 15;
  const total = subtotal + frete;

  const pedidoRes = await pool.query(
    `INSERT INTO pedidos (
       usuario_id, nome_entrega, email_entrega, telefone_entrega, cpf_entrega,
       cep, logradouro, numero, bairro, cidade, estado,
       subtotal, frete, total, status, metodo_pagamento, codigo_rastreio, frete_servico
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
     RETURNING id`,
    [
      usuarioId,
      comprador.nome,
      comprador.email,
      comprador.telefone,
      comprador.cpf,
      comprador.cep,
      comprador.logradouro,
      comprador.numero,
      comprador.bairro,
      comprador.cidade,
      comprador.estado,
      subtotal,
      frete,
      total,
      status,
      metodo,
      extras.codigo_rastreio || null,
      extras.frete_servico || 'PAC',
    ],
  );
  const pedidoId = pedidoRes.rows[0].id;

  for (const item of itens) {
    await pool.query(
      `INSERT INTO pedido_itens (pedido_id, produto_id, nome_produto, quantidade, preco_unitario, subtotal)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [pedidoId, item.produtoId, item.nome, item.qtd, item.preco, item.preco * item.qtd],
    );
  }

  if (status !== 'aguardando_pagamento' && status !== 'cancelado') {
    await pool.query(
      `INSERT INTO pagamentos (pedido_id, mp_payment_id, status, status_mp, valor, metodo)
       VALUES ($1, $2, 'approved', 'approved', $3, $4)`,
      [pedidoId, `dev-mp-${pedidoId}`, total, metodo],
    );
  }

  return pedidoId;
}

async function seedPedidos(pool, userIds, produtoIds, produtos) {
  const byName = (idx) => ({
    produtoId: produtoIds[idx],
    nome: produtos[idx].nome,
    preco: produtos[idx].valor,
    qtd: 1,
  });

  const maria = COMPRADORES[1];
  const joao = COMPRADORES[2];
  const teste = COMPRADORES[0];

  const pedidos = [];

  pedidos.push(await criarPedido(pool, {
    usuarioId: userIds[maria.email],
    comprador: maria,
    status: 'pago',
    metodo: 'pix',
    itens: [byName(0), byName(6)],
  }));

  pedidos.push(await criarPedido(pool, {
    usuarioId: userIds[joao.email],
    comprador: joao,
    status: 'em_separacao',
    metodo: 'cartao',
    itens: [byName(1)],
  }));

  pedidos.push(await criarPedido(pool, {
    usuarioId: userIds[teste.email],
    comprador: teste,
    status: 'enviado',
    metodo: 'pix',
    itens: [byName(3), byName(4)],
    extras: { codigo_rastreio: 'BR123456789BR' },
  }));

  pedidos.push(await criarPedido(pool, {
    usuarioId: userIds[maria.email],
    comprador: maria,
    status: 'aguardando_pagamento',
    metodo: 'boleto',
    itens: [byName(5)],
  }));

  pedidos.push(await criarPedido(pool, {
    usuarioId: userIds[joao.email],
    comprador: joao,
    status: 'cancelado',
    metodo: 'teste',
    itens: [byName(7)],
  }));

  pedidos.push(await criarPedido(pool, {
    usuarioId: userIds[teste.email],
    comprador: teste,
    status: 'entregue',
    metodo: 'sumup_online',
    itens: [byName(2)],
    extras: { codigo_rastreio: 'BR987654321BR', frete: 0, frete_servico: 'Retirada' },
  }));

  return pedidos;
}

async function seedExtras(pool, userIds, produtoIds, produtos) {
  // Carrinho ativo (comprador teste)
  const uid = userIds[COMPRADORES[0].email];
  const pid = produtoIds[6];
  await pool.query(
    `INSERT INTO carrinho_itens (usuario_id, produto_id, quantidade, preco_unitario)
     VALUES ($1, $2, 2, $3)
     ON CONFLICT (usuario_id, produto_id) DO UPDATE SET quantidade = 2, preco_unitario = $3`,
    [uid, pid, produtos[6].valor],
  );

  for (const [i, c] of [
    { nome: `${DEV_PREFIX} Parceiro Alpha`, ordem: 1 },
    { nome: `${DEV_PREFIX} Parceiro Beta`, ordem: 2 },
    { nome: `${DEV_PREFIX} Parceiro Gamma`, ordem: 3 },
  ].entries()) {
    const exists = await pool.query('SELECT id FROM clientes WHERE nome = $1', [c.nome]);
    if (!exists.rows[0]) {
      await pool.query(
        'INSERT INTO clientes (nome, website, ordem, ativo) VALUES ($1, $2, $3, true)',
        [c.nome, i === 0 ? 'https://example.com' : null, c.ordem],
      );
    }
  }

  const bannerTitulo = `${DEV_PREFIX} Promo Verão`;
  const bannerExists = await pool.query('SELECT id FROM banners WHERE titulo = $1', [bannerTitulo]);
  if (!bannerExists.rows[0]) {
    await pool.query(
      `INSERT INTO banners (titulo, subtitulo, imagem, cta_texto, produto_id, ativo, ordem)
       VALUES ($1, $2, $3, 'Ver ofertas', $4, true, 1)`,
      [
        bannerTitulo,
        'Até 30% off em eletrônicos',
        `https://placehold.co/1200x400/${DEFAULT_LOJA_COR_HEX}/white?text=Banner+Promo`,
        produtoIds[0],
      ],
    );
  }

  const botExists = await pool.query(
    `SELECT id FROM bot_respostas WHERE palavra_chave LIKE '%olá%' LIMIT 1`,
  );
  if (!botExists.rows[0]) {
    await pool.query(
      `INSERT INTO bot_respostas (palavra_chave, resposta, ordem, ativo)
       VALUES ('olá, oi, bom dia', 'Olá! Sou o assistente da loja. Como posso ajudar?', 1, true)`,
    );
  }

  await pool.query(`
    UPDATE configuracoes SET valor = 'true' WHERE chave = 'controla_estoque';
    UPDATE configuracoes SET valor = 'Ata Commerce Demo' WHERE chave = 'loja_nome';
    UPDATE configuracoes SET valor = 'Sua loja de demonstração' WHERE chave = 'loja_slogan';
    UPDATE configuracoes SET valor = 'dev_seed_applied' WHERE chave = 'dev_seed_version';
    INSERT INTO configuracoes (chave, valor) VALUES ('dev_seed_version', '1')
    ON CONFLICT (chave) DO UPDATE SET valor = '1';
  `);

  await pool.query('TRUNCATE tentativas_login');
}

async function seedBilling() {
  try {
    await masterDb.query(`
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
    `);

    await masterDb.query(
      `INSERT INTO billing_plans (name, slug, billing_type, price, commission_percentage, description)
       VALUES ('Dev Básico', 'dev-basico', 'fixed', 99.90, NULL, 'Plano demo dev')
       ON CONFLICT (slug) DO NOTHING`,
    );

    const tenant = await masterDb.query('SELECT id FROM tenants WHERE slug = $1', [SLUG]);
    const plan = await masterDb.query(`SELECT id FROM billing_plans WHERE slug = 'dev-basico'`);
    if (tenant.rows[0] && plan.rows[0]) {
      await masterDb.query(
        `INSERT INTO tenant_billing (tenant_id, plan_id, billing_type, monthly_fee, status)
         VALUES ($1, $2, 'fixed', 99.90, 'active')
         ON CONFLICT (tenant_id) DO NOTHING`,
        [tenant.rows[0].id, plan.rows[0].id],
      );
    }
  } catch (err) {
    console.warn('  Billing seed ignorado:', err.message);
  }
}

async function main() {
  const { fresh } = parseArgs();
  console.log(`\n🌱 Seed dev — tenant "${SLUG}"${fresh ? ' (--fresh)' : ''}\n`);

  await runMigrations(connectionString);
  await ensureTenantRegistered();
  const pool = await getPool();
  await initializeTenant(pool, ADMIN.email, ADMIN.senha, ADMIN.nome);

  if (fresh) {
    await clearDevData(pool);
  } else {
    const applied = await pool.query(
      `SELECT valor FROM configuracoes WHERE chave = 'dev_seed_version'`,
    );
    if (applied.rows[0]?.valor === '1') {
      const count = await pool.query(
        `SELECT COUNT(*)::int AS n FROM pedidos p
         JOIN usuarios u ON u.id = p.usuario_id
         WHERE u.email = ANY($1)`,
        [COMPRADORES.map((c) => c.email)],
      );
      if (count.rows[0].n >= 6) {
        console.log('  Seed dev já aplicado. Use --fresh para recriar.\n');
        printSummary();
        process.exit(0);
      }
    }
  }

  console.log('  Usuários...');
  const userIds = {};
  for (const c of COMPRADORES) {
    userIds[c.email] = await upsertUsuario(pool, c);
  }
  console.log(`  Admin: ${ADMIN.email} / ${ADMIN.senha}`);

  console.log('  Categorias e produtos...');
  const categoriaIds = await seedCategorias(pool);
  const produtoIds = await seedProdutos(pool, categoriaIds);

  console.log('  Pedidos e pagamentos...');
  const pedidoIds = await seedPedidos(pool, userIds, produtoIds, PRODUTOS);

  console.log('  Carrinho, banners, config...');
  await seedExtras(pool, userIds, produtoIds, PRODUTOS);

  console.log('  Billing (master)...');
  await seedBilling();

  console.log(`\n✅ Seed concluído — ${produtoIds.length} produtos, ${pedidoIds.length} pedidos\n`);
  printSummary();
  process.exit(0);
}

function printSummary() {
  console.log('── Credenciais ──');
  console.log(`  Admin:      ${ADMIN.email} / ${ADMIN.senha}`);
  for (const c of COMPRADORES) {
    console.log(`  Comprador:  ${c.email} / ${c.senha}`);
  }
  console.log('\n── Cenários de pedido ──');
  console.log('  pago, em_separacao, enviado (com rastreio), aguardando_pagamento, cancelado, entregue');
  console.log('  Carrinho ativo: comprador-test@loja.com (2x Garrafa Térmica)');
  console.log('  Produto sem estoque: Caixa de Som 20W (estoque 0)\n');
}

main().catch((err) => {
  console.error('\n❌ Erro no seed:', err.message);
  process.exit(1);
}).finally(async () => {
  await masterPool.end().catch(() => {});
  if (tenantPool) await tenantPool.end().catch(() => {});
});
