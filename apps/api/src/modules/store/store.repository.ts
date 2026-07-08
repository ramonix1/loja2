import { DEFAULT_LOJA_COR_PRIMARIA } from '@lojao/types/aparencia';
import { DEFAULT_STORE_THEME } from '@lojao/types/store-theme';

import { settingKeyFromEn } from '../../lib/merchant-schema-map.js';
import type { StoreScope } from '../../lib/store-scope.js';

export interface StoreConfig {
  nome: string;
  cor_primaria: string;
  tema: string;
  logo: string;
  slogan: string;
}

export async function findStoreConfig({ pool, storeId }: StoreScope): Promise<StoreConfig> {
  const result = await pool.query(
    `SELECT key, value FROM store_settings
     WHERE store_id = $1 AND key LIKE 'store.%'`,
    [storeId],
  );

  const cfg: Record<string, string> = {};
  for (const row of result.rows as { key: string; value: string | null }[]) {
    cfg[settingKeyFromEn(row.key)] = row.value ?? '';
  }

  return {
    nome: cfg.loja_nome || 'Ata Commerce Demo',
    cor_primaria: cfg.loja_cor_primaria || DEFAULT_LOJA_COR_PRIMARIA,
    tema: DEFAULT_STORE_THEME,
    logo: cfg.loja_logo ?? '',
    slogan: cfg.loja_slogan ?? '',
  };
}
