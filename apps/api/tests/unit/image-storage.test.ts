import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { LocalImageStorage } from '../../src/adapters/storage/local-image-storage.js';
import { resolveR2ObjectKey } from '../../src/adapters/storage/r2-image-storage.js';
import { UploadError } from '../../src/lib/image-validation.js';

describe('LocalImageStorage', () => {
  let tmpDir: string;
  let storage: LocalImageStorage;

  afterEach(async () => {
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
    delete process.env.UPLOAD_DIR;
  });

  it('salva imagem e retorna path /images/', async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lojao-upload-'));
    process.env.UPLOAD_DIR = tmpDir;
    storage = new LocalImageStorage();

    const url = await storage.save({
      buffer: Buffer.from('fake-png'),
      originalFilename: 'foto.png',
      mimetype: 'image/png',
    });

    expect(url).toMatch(/^\/images\/\d+\.png$/);
    const files = await fs.readdir(tmpDir);
    expect(files).toHaveLength(1);
  });

  it('rejeita tipo inválido', async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lojao-upload-'));
    process.env.UPLOAD_DIR = tmpDir;
    storage = new LocalImageStorage();

    await expect(
      storage.save({
        buffer: Buffer.from('x'),
        originalFilename: 'doc.pdf',
        mimetype: 'application/pdf',
      }),
    ).rejects.toBeInstanceOf(UploadError);
  });

  it('remove arquivo ao deletar URL local', async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lojao-upload-'));
    process.env.UPLOAD_DIR = tmpDir;
    storage = new LocalImageStorage();

    const url = await storage.save({
      buffer: Buffer.from('fake-jpg'),
      originalFilename: 'a.jpg',
      mimetype: 'image/jpeg',
    });

    await storage.delete(url);
    const files = await fs.readdir(tmpDir);
    expect(files).toHaveLength(0);
  });
});

describe('resolveR2ObjectKey', () => {
  const publicBase = 'https://cdn.exemplo.com';

  it('resolve URL pública completa', () => {
    expect(resolveR2ObjectKey(`${publicBase}/images/123.jpg`, publicBase)).toBe('images/123.jpg');
  });

  it('resolve path legado /images/ sem base pública', () => {
    expect(resolveR2ObjectKey('/images/123.jpg')).toBe('images/123.jpg');
  });

  it('ignora URL de outro domínio', () => {
    expect(resolveR2ObjectKey('https://outro.com/images/1.jpg', publicBase)).toBeNull();
  });
});
