import sharp from 'sharp';

import type { ImageUploadInput } from '../ports/image-storage.js';
import { assertValidImage } from './image-validation.js';

const DEFAULT_MAX_DIMENSION = 1920;
const DEFAULT_WEBP_QUALITY = 82;

function maxDimension(): number {
  const n = Number(process.env.IMAGE_MAX_DIMENSION);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_MAX_DIMENSION;
}

function webpQuality(): number {
  const n = Number(process.env.IMAGE_WEBP_QUALITY);
  return Number.isFinite(n) && n >= 1 && n <= 100 ? n : DEFAULT_WEBP_QUALITY;
}

function isOptimizeEnabled(): boolean {
  const raw = (process.env.IMAGE_OPTIMIZE ?? '1').trim().toLowerCase();
  return raw !== '0' && raw !== 'false' && raw !== 'off';
}

/**
 * Valida o upload e converte para WebP redimensionado (max lado = IMAGE_MAX_DIMENSION).
 * Reduz storage R2 e peso na vitrine. Desligar com IMAGE_OPTIMIZE=0 (dev/testes).
 */
export async function prepareImageForSave(input: ImageUploadInput): Promise<ImageUploadInput> {
  assertValidImage(input.buffer, input.mimetype);

  if (!isOptimizeEnabled()) {
    return input;
  }

  try {
    const { data, info } = await sharp(input.buffer, { failOn: 'none' })
      .rotate()
      .resize(maxDimension(), maxDimension(), {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: webpQuality(), effort: 4 })
      .toBuffer({ resolveWithObject: true });

    if (info.format !== 'webp' || data.length === 0) {
      return input;
    }

    return {
      buffer: data,
      mimetype: 'image/webp',
      originalFilename: 'upload.webp',
    };
  } catch {
    return input;
  }
}
