import type { FastifyInstance } from 'fastify';

import { buildApp } from '../../src/app.js';

/** Constrói a instância Fastify pronta para `app.inject()` nos testes. */
export async function buildTestApp(): Promise<FastifyInstance> {
  const app = await buildApp();
  await app.ready();
  return app;
}
