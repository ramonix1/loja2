import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import Fastify, { type FastifyInstance } from 'fastify';

import { healthRoutes } from './routes/health.js';
import { v1Routes } from './routes/v1.js';
import { webhookRoutes } from './modules/webhooks/webhook.routes.js';
import { corsPluginOptions } from './lib/cors-config.js';
import { sessionPlugin } from './plugins/session.js';
import { registerSocketIO } from './plugins/socketio.js';
import { imageStoragePlugin } from './plugins/image-storage.js';
import { registerStaticAssets } from './plugins/static-assets.js';

/**
 * Monta a instância Fastify.
 *
 * Auth/tenant, `/api/v1`, webhooks `/webhook/*`, Socket.io, uploads `/images/*`.
 */
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test',
    trustProxy: true,
  });

  await app.register(cors, corsPluginOptions());

  await app.register(cookie);
  await app.register(multipart, {
    limits: { fileSize: 5 * 1024 * 1024 },
  });
  await app.register(sessionPlugin);
  await app.register(imageStoragePlugin);

  await app.register(healthRoutes);
  // Imagens legadas em disco (`/images/*`) — produção CDN redireciona; dev/proxy serve local ou R2.
  await registerStaticAssets(app);
  await app.register(webhookRoutes);
  await app.register(v1Routes, { prefix: '/api/v1' });

  if (process.env.NODE_ENV !== 'test') {
    await registerSocketIO(app);
  }

  return app;
}
