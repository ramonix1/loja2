import type pg from 'pg';

import { settingKeyFromEn } from './merchant-schema-map.js';
import type { StoreScope } from './store-scope.js';

/** MA8 — mapa chave PT → valor a partir de `store_settings` (keys EN). */
export async function getConfigs(scope: StoreScope): Promise<Record<string, string>> {
  const r = await scope.pool
    .query('SELECT key, value FROM store_settings WHERE store_id = $1', [scope.storeId])
    .catch(() => ({ rows: [] }));
  const cfg: Record<string, string> = {};
  for (const row of r.rows as Array<{ key: string; value: string | null }>) {
    cfg[settingKeyFromEn(row.key)] = row.value ?? '';
  }
  return cfg;
}

export async function getLojaInfo(scope: StoreScope): Promise<{ nome: string; email: string }> {
  const r = await scope.pool
    .query(
      `SELECT key, value FROM store_settings
       WHERE store_id = $1 AND key IN ('store.display_name', 'store.contact_email')`,
      [scope.storeId],
    )
    .catch(() => ({ rows: [] }));
  const cfg: Record<string, string> = {};
  for (const row of r.rows as Array<{ key: string; value: string | null }>) {
    cfg[settingKeyFromEn(row.key)] = row.value ?? '';
  }
  return { nome: cfg.loja_nome || 'Ata Commerce Demo', email: cfg.loja_email || '' };
}

/** @deprecated Use `getConfigs(StoreScope)` — mantido para módulos ainda não migrados. */
export async function getConfigsLegacy(db: pg.Pool): Promise<Record<string, string>> {
  const r = await db.query('SELECT chave, valor FROM configuracoes').catch(() => ({ rows: [] }));
  const cfg: Record<string, string> = {};
  for (const row of r.rows as Array<{ chave: string; valor: string | null }>) {
    cfg[row.chave] = row.valor ?? '';
  }
  return cfg;
}

/** @deprecated Use `getLojaInfo(StoreScope)`. */
export async function getLojaInfoLegacy(db: pg.Pool): Promise<{ nome: string; email: string }> {
  const r = await db
    .query("SELECT chave, valor FROM configuracoes WHERE chave IN ('loja_nome','loja_email')")
    .catch(() => ({ rows: [] }));
  const cfg: Record<string, string> = {};
  for (const row of r.rows as Array<{ chave: string; valor: string | null }>) {
    cfg[row.chave] = row.valor ?? '';
  }
  return { nome: cfg.loja_nome || 'Ata Commerce Demo', email: cfg.loja_email || '' };
}
