import fastifyStatic from '@fastify/static';
import type { FastifyInstance } from 'fastify';

import { getUploadDir } from '../lib/upload.js';

/** Serve uploads em `/images/*` (substitui static do Express legacy). */
export async function registerStaticAssets(app: FastifyInstance): Promise<void> {
  await app.register(fastifyStatic, {
    root: getUploadDir(),
    prefix: '/images/',
    decorateReply: false,
  });
}
