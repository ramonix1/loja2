import type pg from 'pg';
import { DEFAULT_LOJA_COR_PRIMARIA } from '@lojao/types/aparencia';
import { parseStoreTheme } from '@lojao/types/store-theme';

import { findLojaConfig } from './tenant.repository.js';

export interface TenantConfigDto {
  nome: string;
  cor_primaria: string;
  tema: ReturnType<typeof parseStoreTheme>;
  logo: string;
  slogan: string;
}

export async function getTenantConfig(db: pg.Pool): Promise<TenantConfigDto> {
  const cfg = await findLojaConfig(db);

  return {
    nome: cfg.loja_nome || 'Ata Commerce Demo',
    cor_primaria: cfg.loja_cor_primaria || DEFAULT_LOJA_COR_PRIMARIA,
    tema: parseStoreTheme(cfg.loja_tema),
    logo: cfg.loja_logo ?? '',
    slogan: cfg.loja_slogan ?? '',
  };
}
