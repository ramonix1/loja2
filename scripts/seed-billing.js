const db = require('../config/db');

const plans = [
  {
    name: 'Básico',
    slug: 'basico',
    description: 'Perfeito para começar',
    price: 99.90,
    billing_type: 'fixed',
    commission_percentage: null,
    features: ['Catálogo com até 100 produtos', 'Sistema de pedidos', 'Até 1.000 pedidos/mês']
  },
  {
    name: 'Profissional',
    slug: 'profissional',
    description: 'Para lojas em crescimento',
    price: 199.90,
    billing_type: 'fixed',
    commission_percentage: null,
    features: ['Produtos ilimitados', 'Sistema de pedidos', 'Clientes e CRM', 'Relatórios avançados', 'Até 10.000 pedidos/mês']
  },
  {
    name: 'Enterprise (Revenue Share)',
    slug: 'enterprise-revenue',
    description: 'Sem mensalidade, pague apenas pelas vendas',
    price: null,
    billing_type: 'revenue_share',
    commission_percentage: 2.0,
    features: ['Tudo do plano Profissional', 'Agendamentos (em breve)', 'Integrações avançadas', 'Suporte prioritário', '2% de comissão por venda']
  },
  {
    name: 'Premium (Hibrido)',
    slug: 'premium-hybrid',
    description: 'Mensalidade reduzida + comissão pequena',
    price: 99.90,
    billing_type: 'hybrid',
    commission_percentage: 1.0,
    features: ['Tudo do plano Profissional', 'R$ 99,90/mês + 1% de comissão', 'Flexibilidade máxima']
  }
];

async function seed() {
  try {
    console.log(' Iniciando seed de planos de billing...');

    for (const plan of plans) {
      await db.query(`
        INSERT INTO billing_plans (name, slug, description, price, billing_type, commission_percentage, features)
        VALUES ($1, $2, $3, $4, $5, $6, $7::text[])
        ON CONFLICT (slug) DO UPDATE SET
          name = $1,
          description = $3,
          price = $4,
          billing_type = $5,
          commission_percentage = $6,
          features = $7::text[],
          updated_at = NOW()
      `, [
        plan.name,
        plan.slug,
        plan.description,
        plan.price,
        plan.billing_type,
        plan.commission_percentage,
        plan.features
      ]);
      console.log(`  ${plan.name}`);
    }

    console.log('\n Seed de planos conclu�do!');
    console.log('\nPlanos dispon�veis:');
    console.log('  - Básico (R$ 99,90/mês)');
    console.log('  - Profissional (R$ 199,90/mês)');
    console.log('  - Enterprise Revenue Share (2% por venda)');
    console.log('  - Premium H�brido (R$ 99,90/mês + 1% por venda)');

    process.exit(0);
  } catch (error) {
    console.error('[ERRO] Erro no seed:', error.message);
    process.exit(1);
  }
}

seed();
