import { afterEach, describe, expect, it } from 'vitest';

import { prepareImageForSave } from '../../src/lib/image-optimize.js';

const MIN_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=',
  'base64',
);

describe('prepareImageForSave', () => {
  afterEach(() => {
    delete process.env.IMAGE_OPTIMIZE;
    delete process.env.IMAGE_MAX_DIMENSION;
    delete process.env.IMAGE_WEBP_QUALITY;
  });

  it('converte JPEG para WebP', async () => {
    const result = await prepareImageForSave({
      buffer: MIN_JPEG,
      originalFilename: 'foto.jpg',
      mimetype: 'image/jpeg',
    });

    expect(result.mimetype).toBe('image/webp');
    expect(result.buffer.subarray(0, 4).toString('ascii')).toBe('RIFF');
  });

  it('respeita IMAGE_OPTIMIZE=0', async () => {
    process.env.IMAGE_OPTIMIZE = '0';

    const result = await prepareImageForSave({
      buffer: MIN_JPEG,
      originalFilename: 'foto.jpg',
      mimetype: 'image/jpeg',
    });

    expect(result.mimetype).toBe('image/jpeg');
    expect(result.buffer).toBe(MIN_JPEG);
  });
});
