import type { ImageStorage } from '../../ports/image-storage.js';
import { LocalImageStorage } from './local-image-storage.js';
import { R2ImageStorage, type R2DeliveryMode } from './r2-image-storage.js';

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

function resolveR2Delivery(): R2DeliveryMode {
  const raw = (process.env.R2_DELIVERY ?? 'proxy').trim().toLowerCase();
  if (raw === 'proxy' || raw === 'cdn') return raw;
  throw new Error(`R2_DELIVERY inválido: "${raw}". Use "proxy" ou "cdn".`);
}

/** Factory — escolhe o adapter conforme `STORAGE_PROVIDER` (default: `local`). */
export function createImageStorage(): ImageStorage {
  const provider = (process.env.STORAGE_PROVIDER ?? 'local').trim().toLowerCase();

  if (provider === 'r2') {
    const delivery = resolveR2Delivery();
    const publicBaseUrl = process.env.R2_PUBLIC_URL?.trim();

    if (delivery === 'cdn' && !publicBaseUrl) {
      throw new Error('R2_DELIVERY=cdn exige R2_PUBLIC_URL (domínio customizado no R2).');
    }

    return new R2ImageStorage({
      accountId: process.env.R2_ACCOUNT_ID ?? '66836ec0393e82929ae0c3090b013f9d',
      accessKeyId: requireEnv('R2_ACCESS_KEY_ID'),
      secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY'),
      bucket: process.env.R2_BUCKET ?? 'ata-commerce',
      delivery,
      publicBaseUrl,
    });
  }

  if (provider !== 'local') {
    throw new Error(`STORAGE_PROVIDER inválido: "${provider}". Use "local" ou "r2".`);
  }

  return new LocalImageStorage();
}
