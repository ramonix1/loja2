import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import { createImageStorage } from '../adapters/storage/create-image-storage.js';
import type { ImageStorage } from '../ports/image-storage.js';

declare module 'fastify' {
  interface FastifyInstance {
    imageStorage: ImageStorage;
  }
}

/** Injeta `app.imageStorage` (port) com adapter escolhido via env. */
export const imageStoragePlugin = fp(async (app: FastifyInstance) => {
  app.decorate('imageStorage', createImageStorage());
});
