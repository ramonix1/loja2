import fs from 'node:fs/promises';
import path from 'node:path';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024;

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UploadError';
  }
}

/** Diretório de uploads servido em `/images/*` pela API. */
export function getUploadDir(): string {
  return (
    process.env.UPLOAD_DIR ?? path.resolve(process.cwd(), '../../data/uploads/images')
  );
}

export async function saveImageFile(
  buffer: Buffer,
  originalFilename: string,
  mimetype: string,
): Promise<string> {
  if (!ALLOWED_TYPES.includes(mimetype)) {
    throw new UploadError('Tipo de arquivo não permitido. Use JPG, PNG, WEBP ou GIF.');
  }
  if (buffer.length > MAX_SIZE) {
    throw new UploadError('Arquivo muito grande. Máximo 5MB.');
  }

  const ext = path.extname(originalFilename) || '.jpg';
  const filename = `${Date.now()}${ext}`;
  const dir = getUploadDir();
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), buffer);
  return `/images/${filename}`;
}

/** Remove arquivo físico a partir da URL `/images/...` (compatível com legacy). */
export async function deleteImageFile(imagemUrl: string): Promise<void> {
  if (!imagemUrl.startsWith('/images/')) return;
  const filepath = path.join(getUploadDir(), path.basename(imagemUrl));
  try {
    await fs.unlink(filepath);
  } catch {
    // arquivo pode já ter sido removido
  }
}
