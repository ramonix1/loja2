import type { AparenciaConfig, AparenciaFields } from '@lojao/types/aparencia';
import { DEFAULT_LOJA_COR_PRIMARIA } from '@lojao/types/aparencia';
import { DEFAULT_STORE_THEME } from '@lojao/types/store-theme';

import type { StoreScope } from '../../lib/store-scope.js';
import type { ImageStorage } from '../../ports/image-storage.js';
import { findAparencia, upsertAparenciaSettings } from './aparencia.repository.js';

export async function getAparencia(scope: StoreScope): Promise<AparenciaConfig> {
  return findAparencia(scope);
}

export async function updateAparencia(
  scope: StoreScope,
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
    ['loja_tema', DEFAULT_STORE_THEME],
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

  await upsertAparenciaSettings(scope, pares);
}
