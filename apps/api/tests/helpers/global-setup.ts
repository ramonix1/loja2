import { seedTestDatabase } from './seed.js';

/**
 * GlobalSetup do vitest: roda uma vez antes da suíte. Garante schema + tenant
 * `loja` + admin de testes no banco apontado por `DATABASE_URL`.
 */
export default async function setup(): Promise<void> {
  process.env.NODE_ENV ??= 'test';
  process.env.PGSSL ??= 'disable';
  await seedTestDatabase();
}
