import path from 'node:path';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UploadError';
  }
}

export function assertValidImage(buffer: Buffer, mimetype: string): void {
  if (!ALLOWED_IMAGE_TYPES.includes(mimetype as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    throw new UploadError('Tipo de arquivo não permitido. Use JPG, PNG, WEBP ou GIF.');
  }
  if (buffer.length > MAX_IMAGE_SIZE) {
    throw new UploadError('Arquivo muito grande. Máximo 5MB.');
  }
}

export function buildImageFilename(originalFilename: string): string {
  const ext = path.extname(originalFilename) || '.jpg';
  return `${Date.now()}${ext}`;
}
