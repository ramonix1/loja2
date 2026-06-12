import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import Fastify, { type FastifyInstance } from 'fastify';

import { healthRoutes } from './routes/health.js';
import { v1Routes } from './routes/v1.js';
import { sessionPlugin } from './plugins/session.js';

/**
 * Monta a instância Fastify.
 *
 * Fase 1: CORS (credentials), cookie + sessão compartilhada com o legacy,
 * resolução de tenant e rotas `/api/v1` (auth + tenant). Health check sem prefixo.
 */
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test',
    trustProxy: true,
  });

  await app.register(cors, {
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:3002',
    ],
    credentials: true,
  });

  await app.register(cookie);
  await app.register(sessionPlugin);

  await app.register(healthRoutes);
  await app.register(v1Routes, { prefix: '/api/v1' });

  return app;
}
