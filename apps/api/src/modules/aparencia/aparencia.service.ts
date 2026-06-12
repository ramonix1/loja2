import type { AparenciaConfig, AparenciaFields } from '@lojao/types/aparencia';
import type { Pool } from 'pg';

import { saveImageFile } from '../../lib/upload.js';

const DEFAULTS: AparenciaConfig = {
  loja_nome: 'Lojão',
  loja_slogan: '',
  loja_cor_primaria: '#2563eb',
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
    if (key in cfg) {
      cfg[key] = row.valor ?? '';
    }
  }
  return cfg;
}

export async function updateAparencia(
  db: Pool,
  fields: AparenciaFields,
  files: {
    logo?: { buffer: Buffer; mimetype: string; filename: string };
    favicon?: { buffer: Buffer; mimetype: string; filename: string };
  },
): Promise<void> {
  const pares: [string, string][] = [
    ['loja_nome', (fields.loja_nome ?? '').trim()],
    ['loja_slogan', (fields.loja_slogan ?? '').trim()],
    ['loja_cor_primaria', fields.loja_cor_primaria ?? '#2563eb'],
    ['loja_rodape', (fields.loja_rodape ?? '').trim()],
    ['loja_email', (fields.loja_email ?? '').trim()],
    ['loja_whatsapp', (fields.loja_whatsapp ?? '').trim()],
  ];

  if (files.logo) {
    const url = await saveImageFile(files.logo.buffer, files.logo.filename, files.logo.mimetype);
    pares.push(['loja_logo', url]);
  }
  if (files.favicon) {
    const url = await saveImageFile(
      files.favicon.buffer,
      files.favicon.filename,
      files.favicon.mimetype,
    );
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
