import fs from 'node:fs/promises';
import fastifyStatic from '@fastify/static';
import type { FastifyInstance } from 'fastify';

import { getUploadDir } from '../lib/upload.js';

/** Serve uploads em `/images/*` (substitui static do Express legacy). */
export async function registerStaticAssets(app: FastifyInstance): Promise<void> {
  const root = getUploadDir();
  await fs.mkdir(root, { recursive: true });
  await app.register(fastifyStatic, {
    root,
    prefix: '/images/',
    decorateReply: false,
  });
}
