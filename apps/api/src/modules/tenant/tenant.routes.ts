import type { FastifyInstance } from 'fastify';
import { DEFAULT_LOJA_COR_PRIMARIA } from '@lojao/types/aparencia';
import { parseStoreTheme } from '@lojao/types/store-theme';

/**
 * Rotas de tenant. `GET /tenant/config` expõe a identidade visual da loja
 * (configs `loja_*`), espelhando o `res.locals.loja` do legacy.
 */
export async function tenantRoutes(app: FastifyInstance): Promise<void> {
  app.get('/tenant/config', async (request, reply) => {
    const result = await request.db.query(
      "SELECT chave, valor FROM configuracoes WHERE chave LIKE 'loja_%'",
    );

    const cfg: Record<string, string> = {};
    for (const row of result.rows as { chave: string; valor: string | null }[]) {
      cfg[row.chave] = row.valor ?? '';
    }

    return reply.send({
      data: {
        nome: cfg.loja_nome || 'Ata Commerce Demo',
        cor_primaria: cfg.loja_cor_primaria || DEFAULT_LOJA_COR_PRIMARIA,
        tema: parseStoreTheme(cfg.loja_tema),
        logo: cfg.loja_logo ?? '',
        slogan: cfg.loja_slogan ?? '',
      },
    });
  });
}
