import type { FastifyInstance } from 'fastify';

import { requireAdmin } from '../../plugins/auth-guard.js';
import {
  createPermissao,
  deletePermissao,
  getPermissoes,
  togglePermissao,
} from './permissoes.controller.js';

export async function permissoesRouter(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdmin);

  app.get('/admin/permissoes', getPermissoes);
  app.post('/admin/permissoes', createPermissao);
  app.patch('/admin/permissoes/:id/toggle', togglePermissao);
  app.delete('/admin/permissoes/:id', deletePermissao);
}
