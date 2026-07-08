import type { FastifyInstance } from 'fastify';

import { requireAdmin } from '../../plugins/auth-guard.js';
import {
  createCategoriaHandler,
  deleteCategoriaHandler,
  getCategoriaById,
  getCategorias,
  updateCategoriaHandler,
} from './categorias.controller.js';

export async function categoriasRouter(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdmin);

  app.get('/admin/categorias', getCategorias);
  app.post('/admin/categorias', createCategoriaHandler);
  app.get('/admin/categorias/:id', getCategoriaById);
  app.put('/admin/categorias/:id', updateCategoriaHandler);
  app.delete('/admin/categorias/:id', deleteCategoriaHandler);
}
