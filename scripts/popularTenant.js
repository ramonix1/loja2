/**
 * Popula um tenant com dados fict�cios para demonstração.
 * Uso: node scripts/popularTenant.js --slug=sapataria-mario
 */
require('dotenv').config();

const { getPool } = require('../config/tenantDb');
const argon2 = require('argon2');

function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach((arg) => {
    const [key, val] = arg.replace('--', '').split('=');
    args[key] = val;
  });
  return args;
}

const SEEDS = {
  'sapataria-mario': {
    produtos: [
      { nome: 'Tênis Casual Urban', subtitulo: 'Conforto para o dia a dia', valor: 189.90, descricao: 'Tênis leve com solado de borracha antiderrapante. Dispon�vel em preto e branco.' },
      { nome: 'Sapato Social Classic', subtitulo: 'Eleg�ncia e durabilidade', valor: 349.00, descricao: 'Sapato em couro leg�timo, ideal para ambientes formais.' },
      { nome: 'Sandália Comfort Plus', subtitulo: 'Para os dias mais quentes', valor: 129.90, descricao: 'Sandália anatômica com palmilha em espuma de memória.' },
      { nome: 'Bota Country Premium', subtitulo: 'Estilo e resistência', valor: 459.00, descricao: 'Bota em couro bovino com biqueira de aço.' },
      { nome: 'Chinelo Relaxante', subtitulo: 'Para casa e piscina', valor: 49.90, descricao: 'Chinelo ergonômico com tiras reguláveis.' },
    ],
    clientes: [
      { nome: 'Couro Brasil', website: 'https://courobrasil.com.br', ordem: 1 },
      { nome: 'Solados SA', website: null, ordem: 2 },
      { nome: 'Fashion Feet', website: null, ordem: 3 },
    ],
    usuario: { nome: 'João Comprador', email: 'joao@email.com', senha: 'Senha@123' },
  },

  'roupas-ana': {
    produtos: [
      { nome: 'Camiseta Básica Algodão', subtitulo: '100% algodão lavado', valor: 59.90, descricao: 'Camiseta unissex em algodão premium. Dispon�vel em 12 cores.' },
      { nome: 'Calça Jeans Skinny', subtitulo: 'Modelagem ajustada', valor: 149.90, descricao: 'Calça com lycra para maior conforto e mobilidade.' },
      { nome: 'Vestido Floral Verão', subtitulo: 'Leve e estiloso', valor: 119.00, descricao: 'Vestido midi em viscose com estampa floral exclusiva.' },
      { nome: 'Jaqueta Jeans Classic', subtitulo: 'Atemporal e versátil', valor: 219.90, descricao: 'Jaqueta em jeans pesado com detalhes bordados.' },
      { nome: 'Shorts Esportivo', subtitulo: 'Para treinos e lazer', valor: 79.90, descricao: 'Shorts em dry-fit com bolsos laterais.' },
      { nome: 'Blazer Slim Fit', subtitulo: 'Sofisticação no trabalho', valor: 299.00, descricao: 'Blazer em tecido misto, forro interno em cetim.' },
    ],
    clientes: [
      { nome: 'Tecidos Brasil', website: null, ordem: 1 },
      { nome: 'Moda Exclusiva', website: 'https://modaexclusiva.com', ordem: 2 },
    ],
    usuario: { nome: 'Maria Compradora', email: 'maria@email.com', senha: 'Senha@123' },
  },
};

async function popular(slug) {
  const seed = SEEDS[slug];
  if (!seed) {
    console.error(`Sem seed para o slug "${slug}". Slugs dispon�veis: ${Object.keys(SEEDS).join(', ')}`);
    process.exit(1);
  }

  const pool = await getPool(slug);
  console.log(`\n Populando tenant "${slug}"...`);

  // Produtos
  for (const p of seed.produtos) {
    const r = await pool.query(
      'INSERT INTO produtos (nome, subtitulo, valor, descricao) VALUES ($1,$2,$3,$4) RETURNING id',
      [p.nome, p.subtitulo, p.valor, p.descricao]
    );
    console.log(`   Produto: ${p.nome} (id=${r.rows[0].id})`);
  }

  // Clientes (logos parceiras)
  for (const c of seed.clientes) {
    await pool.query(
      'INSERT INTO clientes (nome, website, ordem, ativo) VALUES ($1,$2,$3,true)',
      [c.nome, c.website, c.ordem]
    );
    console.log(`   Cliente parceiro: ${c.nome}`);
  }

  // Usuário de teste (role: usuario)
  const senhaHash = await argon2.hash(seed.usuario.senha, {
    type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4,
  });
  await pool.query(
    "INSERT INTO usuarios (nome, email, senha_hash, role) VALUES ($1,$2,$3,'usuario') ON CONFLICT (email) DO NOTHING",
    [seed.usuario.nome, seed.usuario.email, senhaHash]
  );
  console.log(`   Usuário de teste: ${seed.usuario.email} / ${seed.usuario.senha}`);

  console.log(`\n� Tenant "${slug}" populado com sucesso!\n`);
}

const { slug } = parseArgs();
if (!slug) {
  console.error('[ERRO] Informe --slug=<slug>');
  process.exit(1);
}

popular(slug)
  .then(() => process.exit(0))
  .catch((err) => { console.error('[ERRO] Erro:', err.message); process.exit(1); });
