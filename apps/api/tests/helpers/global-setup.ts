import { seedTestDatabase } from './seed.js';

/**
 * GlobalSetup do vitest: roda uma vez antes da suíte. Aplica migrations MA8,
 * provisiona merchant `test-loja` + loja `loja` e fixtures EN no merchant DB.
 */
export default async function setup(): Promise<void> {
  process.env.NODE_ENV ??= 'test';
  process.env.PGSSL ??= 'disable';
  await seedTestDatabase();
}
