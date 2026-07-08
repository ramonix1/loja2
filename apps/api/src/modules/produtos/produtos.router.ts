import type { FastifyInstance } from 'fastify';

import { requireAdmin } from '../../plugins/auth-guard.js';
import {
  createProdutoHandler,
  deleteProdutoHandler,
  deleteProdutoImagemHandler,
  getProdutoById,
  getProdutos,
  updateEstoque,
  updateProdutoHandler,
} from './produtos.controller.js';

export async function produtosRouter(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdmin);

  app.get('/admin/produtos', getProdutos);
  app.get('/admin/produtos/:id', getProdutoById);
  app.post('/admin/produtos', createProdutoHandler);
  app.put('/admin/produtos/:id', updateProdutoHandler);
  app.delete('/admin/produtos/:id', deleteProdutoHandler);
  app.patch('/admin/produtos/:id/estoque', updateEstoque);
  app.delete('/admin/produtos/imagens/:imagemId', deleteProdutoImagemHandler);
}
