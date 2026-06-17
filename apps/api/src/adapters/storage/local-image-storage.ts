import fs from 'node:fs/promises';
import path from 'node:path';

import { getMonorepoRoot } from '../../lib/monorepo-root.js';
import {
  assertValidImage,
  buildImageFilename,
} from '../../lib/image-validation.js';
import { mimeFromFilename } from '../../lib/image-mime.js';
import type { ImageReadResult, ImageStorage, ImageUploadInput } from '../../ports/image-storage.js';

/** Diretório de uploads servido em `/images/*` pela API (provider `local`). */
export function getLocalUploadDir(): string {
  const configured = process.env.UPLOAD_DIR?.trim();
  const root = getMonorepoRoot();

  if (!configured) {
    return path.join(root, 'data/uploads/images');
  }

  if (path.isAbsolute(configured)) {
    return configured;
  }

  // Caminhos relativos no .env são em relação à raiz do monorepo (não `process.cwd()`).
  return path.resolve(root, configured);
}

export class LocalImageStorage implements ImageStorage {
  readonly provider = 'local' as const;

  async save(input: ImageUploadInput): Promise<string> {
    assertValidImage(input.buffer, input.mimetype);
    const filename = buildImageFilename(input.originalFilename);
    const dir = getLocalUploadDir();
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, filename), input.buffer);
    return `/images/${filename}`;
  }

  async delete(url: string): Promise<void> {
    if (!url.startsWith('/images/')) return;
    const filepath = path.join(getLocalUploadDir(), path.basename(url));
    try {
      await fs.unlink(filepath);
    } catch {
      // arquivo pode já ter sido removido
    }
  }

  async read(url: string): Promise<ImageReadResult | null> {
    if (!url.startsWith('/images/')) return null;
    const filepath = path.join(getLocalUploadDir(), path.basename(url));
    try {
      const body = await fs.readFile(filepath);
      return { body, contentType: mimeFromFilename(filepath) };
    } catch {
      return null;
    }
  }
}
