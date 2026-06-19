import { afterEach, describe, expect, it } from 'vitest';

import { resolveCdnPublicBase } from '../../src/plugins/static-assets.js';

describe('resolveCdnPublicBase', () => {
  afterEach(() => {
    delete process.env.R2_DELIVERY;
    delete process.env.R2_PUBLIC_URL;
  });

  it('retorna base CDN quando delivery=cdn', () => {
    process.env.R2_DELIVERY = 'cdn';
    process.env.R2_PUBLIC_URL = 'https://cdn.atalabs.com.br/';
    expect(resolveCdnPublicBase()).toBe('https://cdn.atalabs.com.br');
  });

  it('retorna null em modo proxy (dev)', () => {
    process.env.R2_DELIVERY = 'proxy';
    process.env.R2_PUBLIC_URL = 'https://cdn.atalabs.com.br';
    expect(resolveCdnPublicBase()).toBeNull();
  });

  it('retorna null sem R2_PUBLIC_URL', () => {
    process.env.R2_DELIVERY = 'cdn';
    expect(resolveCdnPublicBase()).toBeNull();
  });
});
