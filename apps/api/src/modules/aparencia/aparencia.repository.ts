import type { AparenciaConfig } from '@lojao/types/aparencia';
import { DEFAULT_LOJA_COR_PRIMARIA } from '@lojao/types/aparencia';
import { DEFAULT_STORE_THEME } from '@lojao/types/store-theme';

import { settingKeyFromEn, settingKeyToEn } from '../../lib/merchant-schema-map.js';
import type { StoreScope } from '../../lib/store-scope.js';

const DEFAULT_STORE_NAME = 'Ata Commerce Demo';

const DEFAULTS: AparenciaConfig = {
  loja_nome: DEFAULT_STORE_NAME,
  loja_slogan: '',
  loja_cor_primaria: DEFAULT_LOJA_COR_PRIMARIA,
  loja_tema: DEFAULT_STORE_THEME,
  loja_rodape: '',
  loja_email: '',
  loja_whatsapp: '',
  loja_logo: '',
  loja_favicon: '',
};

const APARENCIA_PT_KEYS = Object.keys(DEFAULTS) as (keyof AparenciaConfig)[];

export async function findAparencia({ pool, storeId }: StoreScope): Promise<AparenciaConfig> {
  const enKeys = APARENCIA_PT_KEYS.filter((k) => k !== 'loja_tema').map((k) => settingKeyToEn(k));
  const r = await pool.query(
    'SELECT key, value FROM store_settings WHERE store_id = $1 AND key = ANY($2::text[])',
    [storeId, enKeys],
  );
  const cfg = { ...DEFAULTS };
  for (const row of r.rows as { key: string; value: string | null }[]) {
    const ptKey = settingKeyFromEn(row.key) as keyof AparenciaConfig;
    if (ptKey === 'loja_tema') continue;
    if (ptKey in cfg) {
      cfg[ptKey] = row.value ?? '';
    }
  }
  cfg.loja_tema = DEFAULT_STORE_THEME;
  return cfg;
}

export async function upsertAparenciaSettings(
  { pool, storeId }: StoreScope,
  pares: [string, string][],
): Promise<void> {
  for (const [chave, valor] of pares) {
    const enKey = settingKeyToEn(chave);
    await pool.query(
      `INSERT INTO store_settings (store_id, key, value, updated_at) VALUES ($1, $2, $3, NOW())
       ON CONFLICT (store_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [storeId, enKey, valor],
    );
  }
}
