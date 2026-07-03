import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    testTimeout: 60_000,
    // MA6 — `migrate.test.ts` e `merchant-account.schema.test.ts` chamam
    // `runMigrations()` no MESMO banco `lojao` (master); em paralelo, dois
    // `CREATE SCHEMA IF NOT EXISTS "drizzle"` concorrentes colidem (mesma
    // classe de corrida já documentada em `apps/api/vitest.config.ts`).
    fileParallelism: false,
  },
});
