/**
 * Migração: suporte a Asaas e gateways por tenant
 *
 * Uso:
 *   node scripts/migrate-asaas.js
 */
require('dotenv').config();
const masterDb = require('../config/masterDb');

async function migrar() {
  console.log('[migrate-asaas] Iniciando...');

  await masterDb.query(`
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS gateway_type VARCHAR(20) DEFAULT 'asaas_native';
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS asaas_account_id VARCHAR(50);
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS asaas_wallet_id VARCHAR(50);
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS fee_percent_override NUMERIC(5,2);
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS gateway_credentials JSONB DEFAULT '{}';
  `);
  console.log('[migrate-asaas] Colunas adicionadas à tabela tenants');

  await masterDb.query(`
    CREATE TABLE IF NOT EXISTS platform_config (
      chave VARCHAR(100) PRIMARY KEY,
      valor TEXT,
      updated_at TIMESTAMP DEFAULT NOW()
    );
    INSERT INTO platform_config (chave, valor) VALUES
      ('asaas_api_key',             ''),
      ('asaas_env',                 'sandbox'),
      ('asaas_default_fee_percent', '1.50'),
      ('asaas_webhook_token',       '')
    ON CONFLICT (chave) DO NOTHING;
  `);
  console.log('[migrate-asaas] Tabela platform_config criada/verificada');

  console.log('[migrate-asaas] Concluído.');
  process.exit(0);
}

migrar().catch((err) => {
  console.error('[migrate-asaas] Erro:', err.message);
  process.exit(1);
});
