import type { AparenciaConfig, AparenciaFields } from '@lojao/types/aparencia';
import { DEFAULT_LOJA_COR_PRIMARIA } from '@lojao/types/aparencia';
import { DEFAULT_STORE_THEME, parseStoreTheme } from '@lojao/types/store-theme';
import type { Pool } from 'pg';

import type { ImageStorage } from '../../ports/image-storage.js';

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

export async function getAparencia(db: Pool): Promise<AparenciaConfig> {
  const r = await db.query(
    "SELECT chave, valor FROM configuracoes WHERE chave LIKE 'loja_%'",
  );
  const cfg = { ...DEFAULTS };
  for (const row of r.rows as { chave: string; valor: string | null }[]) {
    const key = row.chave as keyof AparenciaConfig;
    if (key === 'loja_tema') continue;
    if (key in cfg) {
      cfg[key] = row.valor ?? '';
    }
  }
  const temaRow = (r.rows as { chave: string; valor: string | null }[]).find(
    (row) => row.chave === 'loja_tema',
  );
  cfg.loja_tema = parseStoreTheme(temaRow?.valor);
  return cfg;
}

export async function updateAparencia(
  db: Pool,
  storage: ImageStorage,
  fields: AparenciaFields,
  files: {
    logo?: { buffer: Buffer; mimetype: string; filename: string };
    favicon?: { buffer: Buffer; mimetype: string; filename: string };
  },
): Promise<void> {
  const pares: [string, string][] = [
    ['loja_nome', (fields.loja_nome ?? '').trim()],
    ['loja_slogan', (fields.loja_slogan ?? '').trim()],
    ['loja_cor_primaria', fields.loja_cor_primaria ?? DEFAULT_LOJA_COR_PRIMARIA],
    ['loja_tema', fields.loja_tema ?? DEFAULT_STORE_THEME],
    ['loja_rodape', (fields.loja_rodape ?? '').trim()],
    ['loja_email', (fields.loja_email ?? '').trim()],
    ['loja_whatsapp', (fields.loja_whatsapp ?? '').trim()],
  ];

  if (files.logo) {
    const url = await storage.save({
      buffer: files.logo.buffer,
      originalFilename: files.logo.filename,
      mimetype: files.logo.mimetype,
    });
    pares.push(['loja_logo', url]);
  }
  if (files.favicon) {
    const url = await storage.save({
      buffer: files.favicon.buffer,
      originalFilename: files.favicon.filename,
      mimetype: files.favicon.mimetype,
    });
    pares.push(['loja_favicon', url]);
  }

  for (const [chave, valor] of pares) {
    await db.query(
      `INSERT INTO configuracoes (chave, valor, updated_at) VALUES ($1, $2, NOW())
       ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW()`,
      [chave, valor],
    );
  }
}
