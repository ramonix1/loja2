/**
 * Migração: tabela de leads para onboarding
 *
 * Uso:
 *   node scripts/migrate-leads.js
 */
require('dotenv').config();
const masterDb = require('../config/masterDb');

async function migrar() {
  console.log('[migrate-leads] Iniciando...');

  await masterDb.query(`
    CREATE TABLE IF NOT EXISTS leads (
      id SERIAL PRIMARY KEY,
      token VARCHAR(64) NOT NULL UNIQUE,
      nome_contato VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL,
      telefone VARCHAR(20),
      nome_empresa VARCHAR(150),
      cpf_cnpj VARCHAR(18),
      slug_desejado VARCHAR(50),
      plano VARCHAR(20) NOT NULL DEFAULT 'basic',
      status VARCHAR(30) NOT NULL DEFAULT 'novo'
        CHECK (status IN ('novo','em_onboarding','aguardando_pagamento','aguardando_ativacao','ativo','cancelado')),
      consultor_nome VARCHAR(100),
      asaas_customer_id VARCHAR(50),
      asaas_payment_id VARCHAR(50),
      tenant_slug VARCHAR(50),
      termos_aceitos_em TIMESTAMP,
      observacoes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_leads_token  ON leads(token);
    CREATE INDEX IF NOT EXISTS idx_leads_email  ON leads(email);
    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
  `);

  console.log('[migrate-leads] Tabela leads criada/verificada');
  console.log('[migrate-leads] Concluído.');
  process.exit(0);
}

migrar().catch((err) => {
  console.error('[migrate-leads] Erro:', err.message);
  process.exit(1);
});
