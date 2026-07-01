import type { FastifyInstance } from 'fastify';

import { requireAdmin } from '../../plugins/auth-guard.js';
import {
  createProdutoHandler,
  deleteProdutoHandler,
  deleteProdutoImagemHandler,
  getProdutoHandler,
  listProdutosHandler,
  updateProdutoEstoqueHandler,
  updateProdutoHandler,
} from './produtos.controller.js';

export async function produtosRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdmin);

  app.get('/admin/produtos', listProdutosHandler);
  app.get('/admin/produtos/:id', getProdutoHandler);
  app.post('/admin/produtos', createProdutoHandler);
  app.put('/admin/produtos/:id', updateProdutoHandler);
  app.delete('/admin/produtos/:id', deleteProdutoHandler);
  app.patch('/admin/produtos/:id/estoque', updateProdutoEstoqueHandler);
  app.delete('/admin/produtos/imagens/:imagemId', deleteProdutoImagemHandler);
}
