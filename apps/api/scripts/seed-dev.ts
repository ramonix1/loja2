/**
 * Seed de desenvolvimento / CI — merchant `test-loja` + loja `loja` (MA8).
 *
 * Reutiliza `seedTestDatabase` (mesmo fixture dos testes de integração).
 * O seed legado PT (`seed-dev.mjs`, tabela `tenants`) foi removido no cutover MA8.
 *
 * Uso:
 *   pnpm --filter api seed:dev
 *   pnpm --filter api seed:fresh
 *   make seed / make seed-fresh
 */
import {
  seedTestDatabase,
  TEST_ADMIN_EMAIL,
  TEST_ADMIN_SENHA,
  TEST_PRIMARY_MERCHANT_SLUG,
  TEST_STORE_SLUG,
  TEST_USER_EMAIL,
  TEST_USER_SENHA,
} from '../tests/helpers/seed.js';

function printSummary(): void {
  console.log('── Credenciais ──');
  console.log(`  Admin (owner):  ${TEST_ADMIN_EMAIL} / ${TEST_ADMIN_SENHA}`);
  console.log(`  Comprador:      ${TEST_USER_EMAIL} / ${TEST_USER_SENHA}`);
  console.log(`\n── Conta ──`);
  console.log(`  Merchant: ${TEST_PRIMARY_MERCHANT_SLUG}`);
  console.log(`  Loja:     ${TEST_STORE_SLUG}`);
  console.log(`  Banco:    atacommerce_${TEST_PRIMARY_MERCHANT_SLUG.replace(/-/g, '_')}\n`);
}

async function main(): Promise<void> {
  const fresh = process.argv.includes('--fresh');
  console.log(
    `\n🌱 Seed dev — merchant "${TEST_PRIMARY_MERCHANT_SLUG}" / loja "${TEST_STORE_SLUG}"${
      fresh ? ' (--fresh: recria fixtures idempotentes)' : ''
    }\n`,
  );

  if (fresh) {
    console.log('  --fresh: fixtures serão upsertados (use make db-reset para banco limpo).\n');
  }

  await seedTestDatabase();

  console.log('\n✅ Seed concluído\n');
  printSummary();
}

main().catch((err: Error) => {
  console.error('\n❌ Erro no seed:', err.message);
  process.exit(1);
});
