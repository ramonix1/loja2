import type { FastifyInstance } from 'fastify';
import { DEFAULT_LOJA_COR_PRIMARIA } from '@lojao/types/aparencia';
import { DEFAULT_STORE_THEME } from '@lojao/types/store-theme';

import { settingKeyFromEn } from '../../lib/merchant-schema-map.js';
import { requireStoreScope } from '../../lib/store-scope.js';

/**
 * Rotas de loja (vitrine). `GET /store/config` expõe a identidade visual
 * (`store_settings` `store.*`), espelhando o `res.locals.loja` do legacy.
 */
export async function storeRoutes(app: FastifyInstance): Promise<void> {
  app.get('/store/config', async (request, reply) => {
    const { pool, storeId } = requireStoreScope(request);
    const result = await pool.query(
      `SELECT key, value FROM store_settings
       WHERE store_id = $1 AND key LIKE 'store.%'`,
      [storeId],
    );

    const cfg: Record<string, string> = {};
    for (const row of result.rows as { key: string; value: string | null }[]) {
      cfg[settingKeyFromEn(row.key)] = row.value ?? '';
    }

    return reply.send({
      data: {
        nome: cfg.loja_nome || 'Ata Commerce Demo',
        cor_primaria: cfg.loja_cor_primaria || DEFAULT_LOJA_COR_PRIMARIA,
        tema: DEFAULT_STORE_THEME,
        logo: cfg.loja_logo ?? '',
        slogan: cfg.loja_slogan ?? '',
      },
    });
  });
}
