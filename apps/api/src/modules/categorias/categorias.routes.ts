import type { FastifyInstance } from 'fastify';

import { requireAdmin } from '../../plugins/auth-guard.js';
import {
  createCategoriaHandler,
  deleteCategoriaHandler,
  getCategoriaHandler,
  listCategoriasHandler,
  updateCategoriaHandler,
} from './categorias.controller.js';

export async function categoriasRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdmin);

  app.get('/admin/categorias', listCategoriasHandler);
  app.post('/admin/categorias', createCategoriaHandler);
  app.get('/admin/categorias/:id', getCategoriaHandler);
  app.put('/admin/categorias/:id', updateCategoriaHandler);
  app.delete('/admin/categorias/:id', deleteCategoriaHandler);
}
